export interface IPaginatedListQuery<QueryOptionsFilter = undefined, QueryOptionsOrder = undefined> {
  page: number;
  limit: number;
  order?: QueryOptionsOrder;
  filter?: QueryOptionsFilter;
}
