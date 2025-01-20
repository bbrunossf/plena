export default function Denied() {
    return (
      <div className="flex min-h-full flex-col justify-center items-center">
        <h1 className="text-3xl font-bold text-red-600">Access Denied</h1>
        <p className="mt-4">You do not have permission to access this resource.</p>
      </div>
    );
  }
  