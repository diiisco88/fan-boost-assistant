export function renderTemplate(
  template: string,
  vars: { name: string; amount?: string }
): string {
  let result = template;
  result = result.replace(/\{\{name\}\}/g, vars.name);
  if (vars.amount !== undefined) {
    result = result.replace(/\{\{amount\}\}/g, vars.amount);
  }
  return result;
}
