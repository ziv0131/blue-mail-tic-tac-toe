export const validateMoveIndex = (
  moveIndex: string,
  gameSize: number,
  indexName: 'row' | 'col'
) => {
  const parsedIndex = parseInt(moveIndex);
  if (isNaN(parsedIndex) || !Number.isInteger(parsedIndex)) {
    throw new Error(`${indexName} is not a valid number`);
  }
  if (parsedIndex < 0 || parsedIndex >= gameSize) {
    throw new Error(`${indexName} is out of boundary`);
  }
  return parsedIndex;
};
