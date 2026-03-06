async function pagination( page=1 , limit = 10 , filter = [] ) {
    page = Number(page)
    limit = Number(limit)
    const skip = (page - 1) * limit;
    const count = await this.aggregate([
        ...filter,
        {
            $count: "count" 
        }
    ]);
    const totalRecords = count[0]?.count || 0;
    const totalPages = Math.ceil(totalRecords / limit);
    const documents = await this.aggregate([
        ...filter,
        { $skip: skip },
        { $limit: limit },
    ])

    return {
        documents,
        totalRecords,
        totalPages,
    };
}
export default pagination