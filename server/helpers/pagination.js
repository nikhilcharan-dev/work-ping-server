async function pagination(search="", page=1 , limit = 10 , filter = [] ) {
    search.trim()
    page = Number(page)
    const skip = (page - 1) * limit;
    const count = await this.aggregate([
        ...filter,
        { $sort : 0 },
        { $count: "count" }
    ]);
    const totalRecords = count[0]?.count || 0;
    const totalPages = Math.ceil(totalRecords / limit);
    const documents = await this.aggregate([
        ...filter,
        { $limit: limit },
        { $skip: skip },
    ])

    return {
        documents,
        totalRecords,
        totalPages,
    };
}
export default pagination