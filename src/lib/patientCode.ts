/**
 * Patient code generation.
 *
 * Mirrors public.generate_patient_code() in
 * supabase/migrations/015_patient_code_numeric.sql — keep the range in sync
 * with that function if either changes.
 *
 * Codes are numeric strings. The column accepts 4 to 6 digits, because the
 * clinic already issues patient IDs with 4 and 5 digits and those have to
 * import cleanly. Generated codes are always 6 digits (100000-999999):
 *
 *   • 900,000 values, so random generation stays collision-free in practice
 *   • a 6-digit code can never equal a 4- or 5-digit legacy ID, since the
 *     strings differ in length, so imports need no coordination with this
 */
const MIN_CODE = 100000;
const MAX_CODE = 999999;

/** Generates a random 6-digit patient code, e.g. `482917`. */
export function generatePatientCode(): string {
  const span = MAX_CODE - MIN_CODE + 1;

  // Rejection sampling over a 32-bit draw: taking a plain modulo would bias
  // the low end of the range, since 2^32 is not a multiple of `span`.
  const limit = Math.floor(0xffffffff / span) * span;
  const buf = new Uint32Array(1);
  let draw: number;
  do {
    crypto.getRandomValues(buf);
    draw = buf[0];
  } while (draw >= limit);

  return String(MIN_CODE + (draw % span));
}

/** True when `err` is Postgres 23505 on the patient_code unique index. */
export function isPatientCodeCollision(err: { code?: string; message?: string } | null): boolean {
  if (!err) return false;
  return err.code === "23505" && (err.message ?? "").includes("patient_code");
}
