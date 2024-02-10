import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config()

type MailData = {
    senderName: string,
    title: string,
    content: string,
    receiver: string
}

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAILSENDER as string,
        pass: process.env.EMAILPASS as string
    }
})

export const sendEmail = async (data: MailData)=>{
    try {
        await transporter.sendMail({
            from: data.senderName,
            to: data.receiver,
            subject: data.title,
            html: data.content
        })
    } catch {
        return null
    }

}