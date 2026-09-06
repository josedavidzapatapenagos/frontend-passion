import { Outlet } from "react-router-dom";
import { Navbar } from "@/components/common/Navbar";

export default function MainLayout() {
  return (
    <div className="vp-main-layout min-h-screen md:flex">
      <Navbar />

      <main className="flex-1 min-w-0">
        <Outlet />
      </main>
    </div>
  );
}