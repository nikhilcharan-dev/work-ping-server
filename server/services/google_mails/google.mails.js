import transporter from "./mailer.js";

const sendMail = async (email, subject, content) => {
    try {
        await transporter.sendMail({
            to: email,
            subject: subject,
            html: content
        })
    } catch (err) {
        console.log("Node Mail Error: ", err.message);
        return Promise.reject(err);
    }
}

exports = {
    sendMail
}