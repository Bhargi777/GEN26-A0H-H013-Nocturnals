// Run with `npm run eval:triage`. Prints how many fixture complaints triage
// puts in the expected category. Uses the model when ANTHROPIC_API_KEY is set,
// otherwise the keyword rules, and says which one answered.
import { z } from "zod";
import { CATEGORY_VALUES } from "./values";
import fixtures from "./fixtures.json";
import { triage } from "./triage";

export const fixtureSchema = z
  .array(
    z.object({
      id: z.number().int(),
      title: z.string().min(1),
      description: z.string().min(1),
      buildingName: z.string().min(1),
      expectedCategory: z.enum(CATEGORY_VALUES),
    }),
  )
  .min(25)
  .max(30);

async function main() {
  const cases = fixtureSchema.parse(fixtures);
  const sources = { model: 0, rules: 0 };
  const misses: string[] = [];
  let correct = 0;

  for (const fixture of cases) {
    const result = await triage({
      title: fixture.title,
      description: fixture.description,
      buildingName: fixture.buildingName,
    });
    sources[result.source] += 1;
    if (result.category === fixture.expectedCategory) {
      correct += 1;
    } else {
      misses.push(
        `  #${fixture.id} "${fixture.title}": expected ${fixture.expectedCategory}, got ${result.category} (${result.source})`,
      );
    }
  }

  const percent = ((correct / cases.length) * 100).toFixed(1);
  console.log(`Triage category: ${correct}/${cases.length} correct (${percent}%)`);
  console.log(`Answered by: model ${sources.model}, rules ${sources.rules}`);
  if (misses.length > 0) console.log(`Misses:\n${misses.join("\n")}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
