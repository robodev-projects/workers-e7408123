export interface IPaginatedList<ItemType> {
  /**
   * 1 indexed page number
   */
  page: number;
  /**
   * Max number of items per page
   */
  limit: number;
  /**
   * List of items
   */
  items: ItemType[];
  /**
   * Total number of items
   */
  totalItems: number;
}
