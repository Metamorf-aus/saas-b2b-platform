import { MedusaContainer } from "@medusajs/framework";
import {
  ContainerRegistrationKeys,
  Modules,
} from "@medusajs/framework/utils";
import { IAuthModuleService } from "@medusajs/types";
import { createCustomerAccountWorkflow } from "@medusajs/medusa/core-flows";
import { APPROVAL_MODULE } from "../modules/approval";
import {
  IApprovalModuleService,
  ModuleCompanySpendingLimitResetFrequency,
} from "../types";
import { createCompaniesWorkflow } from "../workflows/company/workflows";
import { createEmployeesWorkflow } from "../workflows/employee/workflows";

const DEPARTMENTS = [
  { name: "Sales", email: "sales@thepg.com.au" },
  { name: "Marketing", email: "marketing@thepg.com.au" },
  { name: "Procurement", email: "procurement@thepg.com.au" },
];

const BILLY = {
  email: "Billy@thepg.com.au",
  password: "Precision3062",
  first_name: "Billy",
  last_name: "Admin",
  department: "Procurement",
};

export default async function demo_b2b_seed({
  container,
}: {
  container: MedusaContainer;
}) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);

  logger.info("Seeding B2B demo data...");

  // 1) Create the three Departments (companies under the hood).
  const { result: companies } = await createCompaniesWorkflow(container).run({
    input: DEPARTMENTS.map((d) => ({
      name: d.name,
      email: d.email,
      phone: "",
      address: null,
      city: null,
      state: null,
      zip: null,
      country: "au",
      logo_url: null,
      currency_code: "aud",
      spending_limit_reset_frequency:
        ModuleCompanySpendingLimitResetFrequency.MONTHLY,
    })),
  });

  logger.info(`Created ${companies.length} departments.`);

  // 2) Flip each Department's approval settings so any order requires
  //    admin approval. Spending limits remain unset on the Departments
  //    themselves; per-user limits drive who trips the gate.
  const approvalModuleService =
    container.resolve<IApprovalModuleService>(APPROVAL_MODULE);

  const allSettings = await approvalModuleService.listApprovalSettings({
    company_id: companies.map((c) => c.id),
  });

  await approvalModuleService.updateApprovalSettings(
    allSettings.map((s) => ({
      id: s.id,
      requires_admin_approval: true,
    }))
  );

  logger.info("Approval required flag set on all Departments.");

  // 3) Register Billy with emailpass so he can log in to the storefront,
  //    create his Customer record, and link the two.
  const authModuleService = container.resolve<IAuthModuleService>(Modules.AUTH);

  const registerResponse = await authModuleService.register("emailpass", {
    body: { email: BILLY.email, password: BILLY.password },
  });

  if (!registerResponse.success || !registerResponse.authIdentity) {
    throw new Error(
      `Failed to register auth identity for ${BILLY.email}: ${registerResponse.error}`
    );
  }

  const { result: customer } = await createCustomerAccountWorkflow(
    container
  ).run({
    input: {
      authIdentityId: registerResponse.authIdentity.id,
      customerData: {
        email: BILLY.email,
        first_name: BILLY.first_name,
        last_name: BILLY.last_name,
      },
    },
  });

  logger.info(`Created storefront customer ${customer.email}.`);

  // 4) Attach Billy as an admin Employee of Procurement.
  const procurement = companies.find((c) => c.name === BILLY.department);

  if (!procurement) {
    throw new Error(`Department '${BILLY.department}' not found.`);
  }

  await createEmployeesWorkflow(container).run({
    input: {
      employeeData: {
        company_id: procurement.id,
        customer_id: customer.id,
        spending_limit: 0,
        is_admin: true,
      },
      customerId: customer.id,
    },
  });

  logger.info(
    `Linked ${BILLY.email} to ${procurement.name} as admin (no spending limit).`
  );
  logger.info("Finished seeding B2B demo data.");
}
