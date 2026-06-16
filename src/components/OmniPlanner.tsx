import React, { useState, useEffect } from "react";
import { Blueprint, BlueprintPhase, BlueprintTask } from "../types";
import { Calendar, CheckCircle2, Circle, Clock, Flame, BookOpen, RefreshCw, Layers } from "lucide-react";

export default function OmniPlanner() {
  const [goal, setGoal] = useState("Launch an organic lofi coffee brand with minimal packaging and clean aesthetic");
  const [difficulty, setDifficulty] = useState("Adaptive");
  const [isLoading, setIsLoading] = useState(false);
  const [blueprint, setBlueprint] = useState<Blueprint | null>(null);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);

  // Load active blueprint from localStorage
  useEffect(() => {
    const cached = localStorage.getItem("omniplanner_blueprint");
    if (cached) {
      try {
        setBlueprint(JSON.parse(cached));
      } catch (e) {
        setBlueprint(null);
      }
    }
  }, []);

  const saveBlueprint = (bp: Blueprint | null) => {
    setBlueprint(bp);
    if (bp) {
      localStorage.setItem("omniplanner_blueprint", JSON.stringify(bp));
    } else {
      localStorage.removeItem("omniplanner_blueprint");
    }
  };

  const handleGenerate = async () => {
    if (!goal.trim()) return;

    setIsLoading(true);
    setErrorStatus(null);
    saveBlueprint(null);

    try {
      const response = await fetch("/api/blueprint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal, difficultyPref: difficulty })
      });

      const resData = await response.json();

      if (!response.ok || resData.error) {
        throw new Error(resData.error || "Blueprint orchestrator failed.");
      }

      // Add checked status fields dynamically if absent
      const processedPhases = resData.phases.map((ph: BlueprintPhase) => ({
        ...ph,
        tasks: ph.tasks.map((t: BlueprintTask) => ({
          ...t,
          completed: false
        }))
      }));

      const newBlueprint: Blueprint = {
        ...resData,
        phases: processedPhases
      };

      saveBlueprint(newBlueprint);
    } catch (e: any) {
      setErrorStatus(e.message || "Unmapped planner framework error.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleTask = (phaseIndex: number, taskIndex: number) => {
    if (!blueprint) return;

    const newPhases = [...blueprint.phases];
    const task = newPhases[phaseIndex].tasks[taskIndex];
    task.completed = !task.completed;

    const updatedBlueprint = {
      ...blueprint,
      phases: newPhases
    };

    saveBlueprint(updatedBlueprint);
  };

  const handleClear = () => {
    saveBlueprint(null);
  };

  return (
    <div id="omniplanner-panel" className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      
      {/* Planner parameters input (Left) */}
      <div className="lg:col-span-4 bg-[#0a0a0a] border border-white/10 rounded-2xl p-5 space-y-5 shadow-xl">
        <div className="space-y-1">
          <h3 className="font-serif italic text-white text-lg tracking-wide flex items-center gap-2">
            <Calendar className="text-indigo-400" size={18} />
            Strategic Blueprint Creator
          </h3>
          <p className="text-xs text-gray-500">
            Deconstruct complex visions or goals into realistic phased checklists, duration guidelines, and pro-tips.
          </p>
        </div>

        {/* Vision input */}
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">
            Project Objective
          </label>
          <textarea
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            disabled={isLoading}
            className="w-full h-28 text-xs bg-[#121212] border border-white/10 hover:border-white/20 focus:outline-none focus:border-indigo-500/50 rounded-xl p-3 text-gray-200 placeholder-gray-600 resize-none font-sans disabled:opacity-50"
            placeholder="Describe what you represent or want to build step-by-step..."
          />
        </div>

        {/* Vibe Selection */}
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">
            Path Complexity
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            {["Beginner", "Adaptive", "Expert"].map((diff) => {
              const active = difficulty === diff;
              return (
                <button
                  key={diff}
                  onClick={() => setDifficulty(diff)}
                  className={`text-center py-2 px-1 rounded-lg text-[10.5px] font-semibold border transition-all cursor-pointer ${
                    active
                      ? "bg-indigo-600 border-indigo-500 text-white shadow"
                      : "bg-[#0c0c0c] border-white/5 hover:bg-white/5 text-gray-400"
                  }`}
                >
                  {diff}
                </button>
              );
            })}
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={isLoading || !goal.trim()}
          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs h-11 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg disabled:bg-white/10 disabled:text-gray-500 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <RefreshCw size={14} className="animate-spin" />
              Mapping Path Coordinates...
            </>
          ) : (
            <>
              <Layers size={14} />
              Structure Blueprint
            </>
          )}
        </button>

        {errorStatus && (
          <div className="p-3 bg-red-950/40 border border-red-500/20 rounded-xl text-[11px] text-red-300 font-mono">
            FAIL // {errorStatus}
          </div>
        )}
      </div>

      {/* Planned Outputs (Right) */}
      <div className="lg:col-span-8 bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 shadow-xl min-h-[420px] relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(99,102,241,0.03),transparent_75%)] pointer-events-none" />

        {blueprint ? (
          <div className="space-y-6 relative z-10">
            
            {/* Header / Vitals row */}
            <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-white/10 pb-4 gap-4">
              <div>
                <h4 className="font-serif italic text-white text-xl">{blueprint.title}</h4>
                <p className="text-xs text-gray-400 mt-1 leading-relaxed">{blueprint.summary}</p>
              </div>
              <button
                onClick={handleClear}
                className="text-[10px] uppercase font-bold tracking-widest text-red-400 hover:text-red-300 border border-red-500/20 px-3 py-1.5 rounded-lg bg-red-950/10 cursor-pointer self-start md:self-center shrink-0"
              >
                Reset Planner
              </button>
            </div>

            {/* Assessment stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="bg-[#111] border border-white/5 p-3 rounded-xl">
                <p className="text-[10px] uppercase tracking-wider text-gray-500 flex items-center gap-1">
                  <Flame size={12} className="text-orange-400" /> Vibe Level
                </p>
                <p className="text-sm font-semibold text-white mt-1 capitalize">{blueprint.difficulty}</p>
              </div>
              <div className="bg-[#111] border border-white/5 p-3 rounded-xl">
                <p className="text-[10px] uppercase tracking-wider text-gray-500 flex items-center gap-1">
                  <Clock size={12} className="text-indigo-400" /> Completion Target
                </p>
                <p className="text-sm font-semibold text-white mt-1">{blueprint.estimatedTotalTime}</p>
              </div>
              <div className="bg-[#111] border border-white/5 p-3 rounded-xl col-span-2 sm:col-span-1">
                <p className="text-[10px] uppercase tracking-wider text-gray-500 flex items-center gap-1">
                  <CheckCircle2 size={12} className="text-green-400" /> Success Rate
                </p>
                <p className="text-sm font-semibold text-white mt-1">Ready for launch</p>
              </div>
            </div>

            {/* Strategic Tips Panel */}
            {blueprint.tips && blueprint.tips.length > 0 && (
              <div className="bg-indigo-950/20 border border-indigo-500/20 p-4 rounded-xl">
                <h5 className="text-[11px] font-bold uppercase text-indigo-300 flex items-center gap-1.5 mb-2 select-none">
                  <BookOpen size={13} />
                  Workspace Tactical Insights
                </h5>
                <ul className="space-y-1.5 list-disc pl-4 text-xs text-gray-300 leading-relaxed">
                  {blueprint.tips.map((tip, idx) => (
                    <li key={idx}>{tip}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Phased Roadmap list */}
            <div className="space-y-5">
              <h5 className="text-[10px] font-bold uppercase tracking-widest text-gray-550 border-b border-white/5 pb-2">
                Actionable Phases
              </h5>
              <div className="space-y-6">
                {blueprint.phases.map((ph, pIdx) => (
                  <div key={pIdx} className="space-y-3 relative pl-4 border-l border-indigo-500/20 ml-2">
                    <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]" />
                    <div>
                      <h6 className="font-serif italic text-white text-md tracking-wide">
                        {ph.title}
                      </h6>
                      <p className="text-[11.5px] text-gray-500 leading-relaxed mt-0.5">
                        {ph.description}
                      </p>
                    </div>

                    {/* Task block */}
                    <div className="space-y-2 mt-3 pl-2">
                      {ph.tasks.map((task, tIdx) => (
                        <div
                          key={tIdx}
                          onClick={() => handleToggleTask(pIdx, tIdx)}
                          className={`p-3 rounded-xl border flex items-start gap-3 transition-colors duration-200 cursor-pointer ${
                            task.completed
                              ? "bg-[#0b0b0b] border-white/3 opacity-55 text-gray-600 line-through"
                              : "bg-[#111] border-white/5 hover:bg-[#151515] hover:border-white/10 text-gray-200"
                          }`}
                        >
                          <button type="button" className="mt-0.5 shrink-0 select-none">
                            {task.completed ? (
                              <CheckCircle2 size={16} className="text-green-500" />
                            ) : (
                              <Circle size={16} className="text-gray-600 hover:text-white" />
                            )}
                          </button>
                          <div className="flex-1">
                            <p className="text-xs font-semibold leading-relaxed">{task.name}</p>
                            <p className="text-[11px] text-gray-400 mt-0.5 leading-snug">
                              {task.actionableInstruction}
                            </p>
                            <div className="flex gap-2.5 items-center mt-2.5 text-[9px] font-mono select-none">
                              <span className="bg-white/5 px-2 py-0.5 rounded text-gray-500">
                                TIME REF: {task.estimatedDuration || "Flexible"}
                              </span>
                              <span className={`px-2 py-0.5 rounded ${
                                task.milestoneImportance === "Critical"
                                  ? "bg-red-500/10 text-red-400 border border-red-500/15"
                                  : "bg-indigo-500/10 text-indigo-400 border border-indigo-500/15"
                              }`}>
                                {task.milestoneImportance}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                  </div>
                ))}
              </div>
            </div>

          </div>
        ) : (
          <div className="text-center p-6 space-y-4 max-w-sm mx-auto my-auto py-20 flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-[#121212] border border-white/10 flex items-center justify-center text-gray-500">
              <Calendar size={24} />
            </div>
            <div className="space-y-1">
              <p className="font-bold text-gray-300 text-sm">Strategic Engine Offline</p>
              <p className="text-xs text-gray-500 leading-relaxed max-w-xs">
                Submit an objective, target, or blueprint coordinate on the left. The generator will orchestrate highly detailed executable steps for your workspace.
              </p>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
