/**
 * Who runs this deployment. Shown on the privacy policy (`/privacy`) and the
 * imprint (`/imprint`), as the controller under GDPR Art. 13. These are
 * placeholders: replace every value with your own before going live, see
 * `docs/gdpr.md` and `docs/make-it-yours.md`. Which legal fields are required
 * (imprint, representative, register numbers, VAT id) depends on your country
 * and legal form, ask a lawyer.
 */
export const LEGAL = {
  operatorName: "Example Company GmbH",
  addressLines: ["Example Street 1", "12345 Example City", "Germany"],
  /** Contact for data protection requests (shown on the privacy policy). */
  privacyEmail: "privacy@example.com",
  /** General contact (shown in the imprint). */
  contactEmail: "hello@example.com",
  /** Managing director or other legal representative, if your imprint needs one. */
  representative: "Jane Doe",
  /** Commercial register entry, e.g. "Amtsgericht Example, HRB 12345". Empty to hide. */
  register: "",
  /** VAT id, e.g. "DE123456789". Empty to hide. */
  vatId: "",
  /** Where the app is hosted, named as a recipient of the data in the privacy policy. */
  hostingProvider: "Your hosting provider",
} as const
