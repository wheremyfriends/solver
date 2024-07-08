import { it, expect } from "@jest/globals";
import { getOptimisedTimetable } from "../src";

// Gather regression tests
const regressionTests = ["../__mocks__/regression1"];

it.each(regressionTests)("test regression test", async (mod) => {
  const { input, index, config, output } = await import(mod);
  expect(getOptimisedTimetable(input, index, config)).toStrictEqual([output]);
});
