import { FilterQuery, Query, Model } from 'mongoose';

class QueryBuilder<T> {
  public modelQuery: Query<T[], T>;
  public baseModel: Model<T>;
  public query: Record<string, unknown>;
  public finalFilter: FilterQuery<T> = {};

  constructor(modelQuery: Query<T[], T>, query: Record<string, unknown>) {
    this.modelQuery = modelQuery;
    this.baseModel = modelQuery.model;
    this.query = query;

    // Set initial filter like { isDeleted: false }
    this.finalFilter = { ...modelQuery.getFilter() };
  }

  // Search logic
  search(searchableFields: string[]) {
    const searchTerm = this.query.searchTerm as string;
    if (searchTerm) {
      this.finalFilter.$or = searchableFields.map((field) => ({
        [field]: { $regex: searchTerm, $options: 'i' },
      })) as FilterQuery<T>[];
    }
    return this;
  }

  // Filtering logic
  filter() {
    const queryObj: Record<string, any> = { ...this.query };
    const excludeFields = ['searchTerm', 'sort', 'limit', 'page', 'fields'];
    excludeFields.forEach((field) => delete queryObj[field]);

    // CreatedAt date filtering — filter by entire day
    if (queryObj.createdAt && typeof queryObj.createdAt === 'string') {
      const parsedDate = new Date(queryObj.createdAt);

      if (!isNaN(parsedDate.getTime())) {
        const start = new Date(parsedDate);
        start.setUTCHours(0, 0, 0, 0);

        const end = new Date(parsedDate);
        end.setUTCHours(23, 59, 59, 999);

        queryObj.createdAt = {
          $gte: start,
          $lte: end,
        };
      } else {
        delete queryObj.createdAt;
      }
    }

    // Merge all filters
    this.finalFilter = { ...this.finalFilter, ...queryObj };

    // Apply final filter to the query
    this.modelQuery = this.modelQuery.find(this.finalFilter);

    return this;
  }

  // Sorting
  sort() {
    const sortStr =
      (this.query.sort as string)?.split(',')?.join(' ') || '-createdAt';
    this.modelQuery = this.modelQuery.sort(sortStr);
    return this;
  }

  // Pagination
  paginate() {
    const page = Number(this.query.page) || 1;
    const limit = Number(this.query.limit) || 10;
    const skip = (page - 1) * limit;

    this.modelQuery = this.modelQuery.skip(skip).limit(limit);
    return this;
  }

  // Field Limiting
  fields() {
    const fields =
      (this.query.fields as string)?.split(',')?.join(' ') || '-__v';
    this.modelQuery = this.modelQuery.select(fields);
    return this;
  }

  // Metadata Calculation
  async countTotal() {
    const totalDoc = await this.baseModel.countDocuments(this.finalFilter);
    const page = Number(this.query.page) || 1;
    const limit = Number(this.query.limit) || 10;
    const totalPage = Math.ceil(totalDoc / limit);

    return {
      page,
      limit,
      totalDoc,
      totalPage,
    };
  }
}

export default QueryBuilder;
