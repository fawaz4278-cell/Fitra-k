// Quick-add foods with approximate calories (Singapore portions).

export interface FoodPreset {
  name: string;
  kcal: number;
}

export const FOOD_PRESETS: { group: string; items: FoodPreset[] }[] = [
  {
    group: "Cookhouse",
    items: [
      { name: "Cookhouse meal", kcal: 750 },
      { name: "Half-rice cookhouse meal", kcal: 550 },
      { name: "Cookhouse breakfast", kcal: 500 },
    ],
  },
  {
    group: "Drinks",
    items: [
      { name: "Kopi / teh", kcal: 120 },
      { name: "Kopi-O / teh-O kosong", kcal: 5 },
      { name: "Milo", kcal: 150 },
      { name: "Bubble tea", kcal: 350 },
      { name: "Soft drink (can)", kcal: 140 },
      { name: "100plus", kcal: 70 },
    ],
  },
  {
    group: "Snacks",
    items: [
      { name: "Maggi", kcal: 380 },
      { name: "Bread slice", kcal: 80 },
      { name: "Protein bar", kcal: 200 },
      { name: "Chips (packet)", kcal: 250 },
    ],
  },
];
