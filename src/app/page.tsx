import CorporationList from "@/components/corporation/CorporationList";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Voters Corporation Management</h1>
          <p className="mt-2 text-sm text-gray-600">
            View and manage all voter records from the corporation database
          </p>
        </div>
        <CorporationList />
      </div>
    </div>
  );
}
