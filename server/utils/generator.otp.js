export const generatorOtp = (len) => {
    return Math.floor(Math.random() * (10 ** len)).toString();
}
