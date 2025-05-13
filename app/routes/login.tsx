import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  MetaFunction,
} from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, Link, useActionData, useSearchParams } from "@remix-run/react";
import { useEffect, useRef } from "react";

import { verifyLogin } from "~/user.server";
import { createUserSession, getUserId } from "~/session.server";


export const loader = async ({ request }: LoaderFunctionArgs) => {
  const userId = await getUserId(request);
  if (userId) return redirect("/");
  return json({});
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const name = formData.get("name");
  const password = formData.get("password");
  const redirectTo = formData.get("redirectTo");
  const remember = formData.get("remember");

  if (typeof name !== "string" || typeof password !== "string") {
    return json(
      { errors: { name: "Name is required", password: "Password is required" } },
      { status: 400 }
    );
  }

  try {
    const user = await verifyLogin(name, password);
    
    return createUserSession({
      request,
      userId: user.id,
      remember: remember === "on",
      redirectTo: typeof redirectTo === "string" ? redirectTo : "/",
    });
  } catch (error) {
    return json(
      { 
        errors: { 
          login: "Nome de usuário ou senha incorretos. Por favor, tente novamente." 
        } 
      },
      { status: 401 }
    );
  }
};

export default function Login() {
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || "/";
  const actionData = useActionData<typeof action>();
  const nameRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (actionData?.errors?.name) {
      nameRef.current?.focus();
    } else if (actionData?.errors?.password) {
      passwordRef.current?.focus();
    }
  }, [actionData]);

  return (
    <div className="flex min-h-full flex-col justify-center">
      <div className="mx-auto w-full max-w-md px-8">
        {actionData?.errors?.login && (
          <div className="mb-4 rounded bg-red-100 p-3 text-red-700">
            {actionData.errors.login}
          </div>
        )}
        
        <Form method="post" className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium">
              Username
            </label>
            <input
              ref={nameRef}
              id="name"
              name="name"
              type="text"
              autoComplete="username"
              aria-invalid={actionData?.errors?.name ? true : undefined}
              aria-describedby="name-error"
              className="w-full rounded border px-2 py-1"
            />
            {actionData?.errors?.name && (
              <div className="pt-1 text-red-700" id="name-error">
                {actionData.errors.name}
              </div>
            )}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium">
              Password
            </label>
            <input
              ref={passwordRef}
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              aria-invalid={actionData?.errors?.password ? true : undefined}
              aria-describedby="password-error"
              className="w-full rounded border px-2 py-1"
            />
            {actionData?.errors?.password && (
              <div className="pt-1 text-red-700" id="password-error">
                {actionData.errors.password}
              </div>
            )}
          </div>

          <input type="hidden" name="redirectTo" value={redirectTo} />
          
          <div className="flex items-center">
            <input
              id="remember"
              name="remember"
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300"
            />
            <label htmlFor="remember" className="ml-2 block text-sm">
              Remember me
            </label>
          </div>

          <button
            type="submit"
            className="w-full rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
          >
            Log in
          </button>
        </Form>
      </div>
    </div>
  );
}