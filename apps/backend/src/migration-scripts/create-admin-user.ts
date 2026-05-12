import { MedusaContainer } from "@medusajs/framework";
import {
  ContainerRegistrationKeys,
  Modules,
} from "@medusajs/framework/utils";
import { IAuthModuleService, IUserModuleService } from "@medusajs/types";

export default async function create_admin_user({
  container,
}: {
  container: MedusaContainer;
}) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const userModule = container.resolve<IUserModuleService>(Modules.USER);
  const authModule = container.resolve<IAuthModuleService>(Modules.AUTH);

  const email = process.env.MEDUSA_ADMIN_EMAIL ?? "Billy@thepg.com.au";
  const password = process.env.MEDUSA_ADMIN_PASSWORD ?? "Precision3062";

  const existing = await userModule.listUsers({ email: [email] });
  if (existing.length > 0) {
    logger.info(`Admin user ${email} already exists — skipping.`);
    return;
  }

  const [user] = await userModule.createUsers([
    { email, first_name: "Billy", last_name: "Admin" },
  ]);
  logger.info(`Created admin user record: ${user.id}`);

  const { authIdentity, success, error } = await authModule.register(
    "emailpass",
    { body: { email, password } }
  );

  if (!success || !authIdentity) {
    throw new Error(`Auth registration failed: ${error}`);
  }

  await authModule.updateAuthIdentities([
    { id: authIdentity.id, app_metadata: { user_id: user.id } },
  ]);

  logger.info(`Admin user ${email} created successfully.`);
}
