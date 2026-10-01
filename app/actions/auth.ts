'use server'

import { prisma } from "../lib/prisma"
import { setAuthCookies, deleteAuthCookies } from "../lib/session"
import bcrypt from "bcryptjs"
import { redirect } from "next/navigation"
import { getT } from "../lib/i18n/server"

export interface AuthFormState {
  error?: string;
}

export async function loginAction(prevState: AuthFormState | null, formData: FormData ){
    const t = await getT()
    const userName = formData.get('userName') as string
    const password = formData.get('password') as string

    if(!userName || !password){
        return { error: t.login.fillAll }
    }

    const user = await prisma.user.findUnique({
        where: { userName }
    })

    if(!user){
        return { error: t.login.invalid }
    }

    // Verify hashed password

    const isPasswordValid = await bcrypt.compare(password, user.password)

    if(!isPasswordValid){
        return { error: t.login.invalid }
    }

    await setAuthCookies({ userId: user.userId, userName: user.userName })
    redirect('/')
}

/** Clears both auth cookies and sends the user to /login. */
export async function logoutAction() {
    await deleteAuthCookies()
    redirect('/login')
}