const pagination = async ( MODEL, page=1 , limit = 10 , filter = [] )=>{
    page = Number(page)
    limit = Number(limit)
    const skip = (page - 1) * limit;

    try{
        const count = await MODEL.aggregate([
            ...filter,
            {
                $count: "count"
            }
        ]);

        const totalRecords = count[0]?.count || 0;
        const totalPages = Math.ceil(totalRecords / limit);
        const documents = await MODEL.aggregate([
            ...filter,
            {$skip: skip},
            {$limit: limit},
        ])

        return {
            documents,
            totalRecords,
            totalPages,
        };
    }
    catch (err){
        console.log(err)
        return {
            documents:[],
            totalRecords:0,
            totalPages:0,
        };
    }
}
export default pagination