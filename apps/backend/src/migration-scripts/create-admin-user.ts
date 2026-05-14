import { MedusaContainer } from "@medusajs/framework";
import {
  ContainerRegistrationKeys,
  Modules,
} from "@medusajs/framework/utils";
import { IAuthModuleService, IUserModuleService } from "@medusajs/types";

async function ensureAdminUser(
  userModule: IUserModuleService,
  authModule: IAuthModuleService,
  logger: any,
  opts: {
    email: string
    password: string
    first_name: string
    last_name: string
  }
) {
  const existing = await userModule.listUsers({ email: [opts.email] });
  if (existing.length > 0) {
    logger.info(`Admin user ${opts.email} already exists — skipping.`);
    return;
  }

  const [user] = await userModule.createUsers([
    { email: opts.email, first_name: opts.first_name, last_name: opts.last_name },
  ]);

  const { authIdentity, success, error } = await authModule.register(
    "emailpass",
    { body: { email: opts.email, password: opts.password } }
  );

  if (!success || !authIdentity) {
    throw new Error(`Auth registration failed for ${opts.email}: ${error}`);
  }

  await authModule.updateAuthIdentities([
    { id: authIdentity.id, app_metadata: { user_id: user.id } },
  ]);

  logger.info(`Admin user ${opts.email} created successfully.`);
}

export default async function create_admin_user({
  container,
}: {
  container: MedusaContainer;
}) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const userModule = container.resolve<IUserModuleService>(Modules.USER);
  const authModule = container.resolve<IAuthModuleService>(Modules.AUTH);

  await ensureAdminUser(userModule, authModule, logger, {
    email: process.env.MEDUSA_ADMIN_EMAIL ?? "Billy@thepg.com.au",
    password: process.env.MEDUSA_ADMIN_PASSWORD ?? "Precision3062",
    first_name: "Billy",
    last_name: "Admin",
  });

  await ensureAdminUser(userModule, authModule, logger, {
    email: "cory@thepg.com.au",
    password: "Precision3062",
    first_name: "Cory",
    last_name: "Approver",
  });
}
