"use client";

import React from "react";
import { LayoutDashboard, Star, Brain, Settings, Palette } from "lucide-react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useRouter } from "next/navigation";



export const defaultNavItems = [
    { key: "dashboard" as const, label: "Dashboard", icon: LayoutDashboard },
    { key: "templates" as const, label: "Standard", icon: Star },
    { key: "designs" as const, label: "Smart", icon: Brain },



];
export const BelongingNavItems = [
    { key: "settings" as const, label: "Settings", icon: Settings },
]

const DashboardSidebar = () => {


    const pathname = usePathname();
    const activeTab = pathname.split("?")[0].split("/").pop();
    const router = useRouter();




    return (
        <aside
            className="sticky top-0 h-screen w-[115px] flex flex-col justify-between bg-[#F6F6F9] backdrop-blur border-r border-neutral-800/60 px-4  py-8"
            aria-label="Dashboard sidebar"
        >
            <div>

                <div onClick={() => router.push("/dashboard")} className="flex items-center  pb-6 border-b border-neutral-800/60   gap-2    ">
                    <div className="bg-[#7C51F8] rounded-full cursor-pointer p-1 flex justify-center items-center mx-auto">
                        <img src="/logo-with-bg.png" alt="Slideweaver logo" className="h-[40px] object-contain w-full" />
                    </div>
                </div>
                <nav className="pt-6 font-syne" aria-label="Dashboard sections">
                    <div className="  space-y-6">

                        {/* Dashboard */}
                        <Link
                            prefetch={false}
                            href={`/dashboard`}
                            className={[
                                "flex flex-col tex-center items-center gap-2  transition-colors",
                                pathname === "/dashboard" ? "" : "ring-transparent",
                            ].join(" ")}
                            aria-label="Dashboard"
                            title="Dashboard"
                        >
                            <LayoutDashboard className={["h-4 w-4", pathname === "/dashboard" ? "text-[#dc2626]" : "text-neutral-400"].join(" ")} />
                            <span className="text-[11px] text-gray-200">Dashboard</span>
                        </Link>
                        <Link
                            prefetch={false}
                            href={`/templates`}
                            className={[
                                "flex flex-col tex-center items-center gap-2  transition-colors",
                                pathname === "/templates" ? "" : "ring-transparent",
                            ].join(" ")}
                            aria-label="Templates"
                            title="Templates"
                        >
                            <div className="flex flex-col cursor-pointer tex-center items-center gap-2  transition-colors">
                                <Star className={`h-4 w-4 ${pathname === "/templates" ? "text-[#dc2626]" : "text-neutral-400"}`} />
                                <span className="text-[11px] text-gray-200">Templates</span>
                            </div>
                        </Link>
                        <Link
                            prefetch={false}
                            href={`/theme`}
                            className={[
                                "flex flex-col tex-center items-center gap-2  transition-colors",
                                pathname === "/theme" ? "" : "ring-transparent",
                            ].join(" ")}
                            aria-label="Theme"
                            title="Theme"
                        >
                            <div className="flex flex-col cursor-pointer tex-center items-center gap-2  transition-colors">
                                <Palette className={`h-4 w-4 ${pathname === "/theme" ? "text-[#dc2626]" : "text-neutral-400"}`} />
                                <span className="text-[11px] text-gray-200">Themes</span>
                            </div>
                        </Link>
                    </div>
                </nav>
            </div>

            <div className=" pt-5 border-t border-neutral-800/60  font-syne "
            >
                {BelongingNavItems.map(({ key, label: itemLabel, icon: Icon }) => {
                    const isActive = activeTab === key;
                    return (
                        <Link
                            prefetch={false}
                            key={key}
                            href={`/${key}`}
                            className={[
                                "flex flex-col tex-center items-center gap-2  transition-colors ",
                                isActive ? "" : "ring-transparent",
                            ].join(" ")}
                            aria-label={itemLabel}
                            title={itemLabel}
                        >
                            <Icon className={["h-4 w-4", isActive ? "text-[#dc2626]" : "text-neutral-400"].join(" ")} />
                            <span className="text-[11px] text-gray-200">{itemLabel}</span>
                        </Link>
                    );
                })}



            </div>

        </aside>
    );
};

export default DashboardSidebar;


