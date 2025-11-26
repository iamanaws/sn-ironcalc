export interface TestData {
  uuid: string;
  title: string;
  text: string;
  meta?: any;
}

const EMPTY_SPREADSHEET: TestData = {
  uuid: 'note-uuid-empty-spreadsheet-001',
  title: 'New Spreadsheet',
  text: '',
  meta: {}
};

const BUDGET_SPREADSHEET: TestData = {
  uuid: 'note-uuid-monthly-budget-002',
  title: 'Monthly Budget',
  text: '',
  meta: {}
};

const INVENTORY_SPREADSHEET: TestData = {
  uuid: 'note-uuid-inventory-tracker-003',
  title: 'Inventory Tracker',
  text: '',
  meta: {}
};

export const TEST_DATA: TestData[] = [EMPTY_SPREADSHEET, BUDGET_SPREADSHEET, INVENTORY_SPREADSHEET];
