export const asyncHandler = (fn, feature = "UNKNOWN") => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch((err) => {
            err.feature = err.feature || feature;
            next(err);
        });
    };
};
