import { useEffect, useState, useRef, useLayoutEffect } from "react";
import { useTutorial } from "../hooks/useTutorial";
import { gettingStartedTutorial } from "../content/getting-started";
import { Button } from "../../components/common/Button";
import "./TutorialOverlay.css";

export const TutorialOverlay = () => {
  const {
    isActive,
    currentStep,
    steps,
    nextStep,
    prevStep,
    closeTutorial,
    startTutorial,
  } = useTutorial("getting-started", gettingStartedTutorial);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Auto-start tutorial on first visit
  useEffect(() => {
    const hasSeenTutorial = localStorage.getItem("hasSeenTutorial");
    if (!hasSeenTutorial && !isActive) {
      const timer = setTimeout(() => {
        startTutorial();
        localStorage.setItem("hasSeenTutorial", "true");
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isActive, startTutorial]);

  // Calculate tooltip position
  useLayoutEffect(() => {
    if (!isActive || currentStep >= steps.length) return;

    const step = steps[currentStep];
    let element: HTMLElement | null = null;

    if (typeof step.target === "string") {
      element = document.querySelector(step.target) as HTMLElement;
    } else {
      element = step.target();
    }

    // Use requestAnimationFrame to avoid setState in effect
    requestAnimationFrame(() => {
      if (element !== targetElement) {
        setTargetElement(element);
      }

      if (!element) {
        // Center for body/center placement
        setPosition({
          top: window.innerHeight / 2,
          left: window.innerWidth / 2,
        });
        return;
      }

      const rect = element.getBoundingClientRect();
      const tooltipRect = tooltipRef.current?.getBoundingClientRect();
      const placement = step.placement || "bottom";

      let top = 0;
      let left = 0;

      switch (placement) {
        case "top":
          top = rect.top - (tooltipRect?.height || 0) - 10;
          left = rect.left + rect.width / 2;
          break;
        case "bottom":
          top = rect.bottom + 10;
          left = rect.left + rect.width / 2;
          break;
        case "left":
          top = rect.top + rect.height / 2;
          left = rect.left - (tooltipRect?.width || 0) - 10;
          break;
        case "right":
          top = rect.top + rect.height / 2;
          left = rect.right + 10;
          break;
        case "center":
          top = window.innerHeight / 2;
          left = window.innerWidth / 2;
          break;
      }

      setPosition({ top, left });
    });
  }, [isActive, currentStep, steps, targetElement]);

  if (!isActive || currentStep >= steps.length) return null;

  const step = steps[currentStep];
  const isFirst = currentStep === 0;
  const isLast = currentStep === steps.length - 1;

  return (
    <>
      {/* Backdrop */}
      <div className="tutorial-backdrop" onClick={closeTutorial} />

      {/* Highlight overlay */}
      {targetElement && step.placement !== "center" && (
        <div
          className="tutorial-highlight"
          style={{
            top: targetElement.getBoundingClientRect().top + window.scrollY,
            left: targetElement.getBoundingClientRect().left + window.scrollX,
            width: targetElement.getBoundingClientRect().width,
            height: targetElement.getBoundingClientRect().height,
          }}
        />
      )}

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className={`tutorial-tooltip tutorial-tooltip-${step.placement || "bottom"}`}
        style={{ top: `${position.top}px`, left: `${position.left}px` }}
      >
        <div className="tutorial-tooltip-content">
          {step.title && (
            <h3 className="tutorial-tooltip-title">{step.title}</h3>
          )}
          <div className="tutorial-tooltip-body">{step.content}</div>
        </div>
        <div className="tutorial-tooltip-footer">
          <div className="tutorial-progress">
            Step {currentStep + 1} of {steps.length}
          </div>
          <div className="tutorial-actions">
            {!isFirst && (
              <Button variant="ghost" size="sm" onClick={prevStep}>
                Back
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={closeTutorial}>
              Skip
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={isLast ? closeTutorial : nextStep}
            >
              {isLast ? "Finish" : "Next"}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};
