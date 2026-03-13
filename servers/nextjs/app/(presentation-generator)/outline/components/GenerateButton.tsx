import React from "react";
import { usePathname } from "next/navigation";
import { trackEvent, MixpanelEvent } from "@/utils/mixpanel";
import { Button } from "@/components/ui/button";
import { LoadingState, Template } from "../types/index";
import { TemplateLayoutsWithSettings } from "@/app/presentation-templates/utils";
import { ChevronRight } from "lucide-react";

interface GenerateButtonProps {
  loadingState: LoadingState;
  streamState: { isStreaming: boolean; isLoading: boolean };
  selectedTemplate: TemplateLayoutsWithSettings | string | null;
  onSubmit: () => void;
  outlineCount: number;
}

const GenerateButton: React.FC<GenerateButtonProps> = ({
  loadingState,
  streamState,
  selectedTemplate,
  outlineCount,
  onSubmit,
}) => {
  const pathname = usePathname();

  const isDisabled =
    loadingState.isLoading || streamState.isLoading || streamState.isStreaming;

  const getButtonText = () => {
    if (loadingState.isLoading) return loadingState.message;
    if (streamState.isLoading || streamState.isStreaming) return "Loading...";
    if (!selectedTemplate) return "Select a Template";
    return "Generate Presentation";
  };

  return (
    <Button
      disabled={isDisabled}
      onClick={() => {
        if (!streamState.isLoading && !streamState.isStreaming) {
          if (!selectedTemplate) {
            trackEvent(MixpanelEvent.Outline_Select_Template_Button_Clicked, {
              pathname,
            });
          } else {
            trackEvent(
              MixpanelEvent.Outline_Generate_Presentation_Button_Clicked,
              { pathname }
            );
          }
        }
        onSubmit();
      }}
      className="w-full flex justify-center items-center gap-2 rounded-md text-sm py-3 px-5 font-semibold text-white bg-[#dc2626] hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-syne"
    >

      {getButtonText()}
      <ChevronRight className="w-4 h-4" />
    </Button>
  );
};

export default GenerateButton;
