import { 
    ActionFunctionArgs, 
    LoaderFunctionArgs, 
    json, 
    redirect 
  } from "@remix-run/node";
  import { Form, useActionData, useNavigation  } from "@remix-run/react";
  import { changeUserPassword } from "~/user.server";  
  import { getUserId, requireUserId } from "~/session.server";
  
  export const loader = async ({ request }: LoaderFunctionArgs) => {
    await requireUserId(request);
    return json({});
  };
  
  export async function action({ request }: ActionFunctionArgs) {
    const userId = await getUserId(request);

    const formData = await request.formData();
    
    const currentPassword = formData.get("currentPassword")?.toString();
    const newPassword = formData.get("newPassword")?.toString();
    const confirmPassword = formData.get("confirmPassword")?.toString();    
  
    // Validações básicas
    if (!currentPassword || !newPassword || !confirmPassword) {
      return json({ 
        error: "Todos os campos são obrigatórios" 
      }, { status: 400 });
    }
  
    if (newPassword !== confirmPassword) {
      return json({ 
        error: "Senhas não coincidem" 
      }, { status: 400 });
    }
  
    try {      
      const result = await changeUserPassword(
        userId, 
        currentPassword, 
        newPassword
      );
  
      return json(result);
    } catch (error) {
      return json({ 
        error: error instanceof Error ? error.message : "Erro ao alterar senha" 
      }, { status: 500 });
    }
  }
  
  // Este componente é executado no cliente
  export default function ChangePasswordPage() {
    const actionData = useActionData<typeof action>();
    const navigation = useNavigation();
    const isSubmitting = navigation.state === "submitting";
  
    return (
        <div className="max-w-md mx-auto p-6">
          <h1 className="text-xl font-bold mb-4">Alterar Senha</h1>
          <Form method="post">
            <div className="mb-4">
              <label className="block mb-2" htmlFor="currentPassword">Senha Atual</label>
              <input 
                className="w-full p-2 border rounded"
                type="password" 
                id="currentPassword" 
                name="currentPassword" 
                required 
                disabled={isSubmitting}
              />
            </div>
            <div className="mb-4">
              <label className="block mb-2" htmlFor="newPassword">Nova Senha</label>
              <input 
                className="w-full p-2 border rounded"
                type="password" 
                id="newPassword" 
                name="newPassword" 
                required 
                disabled={isSubmitting}
              />              
            </div>
            <div className="mb-4">
              <label className="block mb-2" htmlFor="confirmPassword">Confirmar Nova Senha</label>
              <input 
                className="w-full p-2 border rounded"
                type="password" 
                id="confirmPassword" 
                name="confirmPassword" 
                required 
                disabled={isSubmitting}
              />
            </div>
            
            {actionData?.error && (
              <div className="p-3 mb-4 bg-red-100 text-red-700 rounded">
                {actionData.error}
                {actionData.passwordErrors && (
                  <ul className="list-disc ml-5 mt-2">
                    {actionData.passwordErrors.map((err: string, i: number) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
            
            {actionData?.message && (
              <div className="p-3 mb-4 bg-green-100 text-green-700 rounded">
                {actionData.message}
              </div>
            )}
            
            <button 
              type="submit" 
              className="w-full p-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Alterando..." : "Alterar Senha"}
            </button>
          </Form>
        </div>
      );
    }