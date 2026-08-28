'use server'

import { prisma } from "../lib/prisma"
import { setAuthCookies } from "../lib/session"
import bcrypt from "bcryptjs"
import { redirect } from "next/navigation"

export interface AuthFormState {
  error?: string;
}

export async function loginAction(prevState: AuthFormState | null, formData: FormData ){
    const userName = formData.get('userName') as string
    const password = formData.get('password') as string

    if(!userName || !password){
        return { error: 'Please fill in all the fields' }
    }

    const user = await prisma.user.findUnique({
        where: { userName }
    })

    if(!user){
        return { error: "Invalid username or password"}
    }

    // Verify hashed password

    const isPasswordValid = await bcrypt.compare(password, user.password)

    if(!isPasswordValid){
        return { error: "Invalid username or password"}
    }

    await setAuthCookies({ userId: user.userId, userName: user.userName })
    redirect('/campaigns')
}