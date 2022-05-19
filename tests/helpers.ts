// Check if items of specific array contain specific code

export const isAllEqualStatusCode = (list: number[], comparedCode: number) => {
  const foundWrongItems = list.filter((item) => item !== comparedCode);
  return foundWrongItems.length === 0;
};
