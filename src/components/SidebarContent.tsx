
import React from "react";
import {Sidebar, SidebarContent} from "@/components/ui/sidebar";
import MatchForm from "@/components/MatchForm";

const AppSidebar = () => {
  return (
    <Sidebar collapsible="offcanvas">
      <SidebarContent>
        <MatchForm />
      </SidebarContent>
    </Sidebar>
  );
};

export default AppSidebar;
