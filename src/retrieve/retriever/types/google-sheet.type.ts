export type GoogleSheetColumnsName = 'date' | 'value';

export type GoogleSheetSerializedValues = {
  [key in GoogleSheetColumnsName]: any;
};
