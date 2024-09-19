import { Form } from "@/components/form";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from "@/components/ui/input-otp";
import { validateRequest } from "@/lib/auth"
import { verifyAccount } from "@/lib/auth/actions";
import { redirect } from "next/navigation";
import ResendCodeButton from "./resend-button";
import { generateEmailVerificationCode, sendVerificationEmail } from "@/lib/auth/email";

export default async function VerifyAccountPage() {
	const { user } = await validateRequest();

	if (!user) {
		return redirect("/auth/login");
	}

	if (user.email_verified) {
		return redirect("/auth/verify/success")
	}



	return (
		<>
			<div className="flex flex-col gap-4 items-center w-full h-snug justify-center">
				<div className="text-center">
					<h1 className="text-3xl font-bold">
						Almost there!
					</h1>
					<p>
						Please check your email ({user?.email}) for a verification code and enter it below to verify your account.
					</p>
				</div>
				<Form action={verifyAccount} className="w-full flex flex-col items-center gap-4">
					<InputOTP maxLength={6} className="w-full" id="code" name="code">
						<InputOTPGroup>
							<InputOTPSlot index={0} />
							<InputOTPSlot index={1} />
							<InputOTPSlot index={2} />
						</InputOTPGroup>
						<InputOTPSeparator />
						<InputOTPGroup>
							<InputOTPSlot index={3} />
							<InputOTPSlot index={4} />
							<InputOTPSlot index={5} />
						</InputOTPGroup>
					</InputOTP>
					<div className="flex flex-row gap-2">

						<Button type="submit">
							Submit
						</Button>
					</div>
				</Form>
			</div>
		</>
	)
}