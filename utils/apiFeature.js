class APIFeature {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    let queryStringCopy = { ...this.queryString };
    const excludeFields = ['sort', 'fields', 'limit', 'page'];
    excludeFields.forEach((el) => delete queryStringCopy[el]);

    // advanced filter (gt, gte, lt, lte)
    queryStringCopy = JSON.stringify(queryStringCopy);
    queryStringCopy = JSON.parse(
      queryStringCopy.replace(/\b(gt|gte|lt|lte)\b/g, (match) => `$${match}`),
    );

    // add thêm method cho this.query
    this.query = this.query.find(queryStringCopy);

    // để có thể chaining đc, sau mỗi lần instance của class APIFeature gọi instance.filter(), thì instance.filter() phải trả về
    // một APIFeature, để có thể chaining tiếp các method khác phía sau ("instance".filter().sort()...)
    // => return về this sau khi add thêm method cho this.query
    return this;
  }

  sort() {
    if (this.queryString.sort) {
      console.log(this.queryString.sort);
      const sortBy = this.queryString.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort('-createAt');
    }

    return this;
  }

  limitFields() {
    if (this.queryString.fields) {
      const selectFields = this.queryString.fields.split(',').join(' ');

      this.query = this.query.select(selectFields);
    }
    this.query = this.query.select('-__v');

    return this;
  }

  paginate() {
    const page = this.queryString.page * 1 || 1;
    const limit = this.queryString.limit * 1 || 100;
    const skip = (page - 1) * limit;
    this.query = this.query.skip(skip).limit(limit);

    return this;
  }
}

export default APIFeature;