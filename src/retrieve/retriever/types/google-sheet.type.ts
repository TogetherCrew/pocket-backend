export type GoogleSheetColumnsName = 'Date' | 'value';

export type GoogleSheetSerializedValues = {
  [key in GoogleSheetColumnsName]: any;
};
