import lodash from "lodash";

export const pick = (values, keys) => {
    return lodash.pick(values, keys);
}
