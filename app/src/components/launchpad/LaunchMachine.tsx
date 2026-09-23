"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type PointerEvent } from "react";
import { Pause, Play, ArrowUpRight, LockKeyhole } from "lucide-react";
import { launchpad } from "@/lib/launchpad/config";
import { CHAIN_KEYS, CHAIN_SHORT, explorerAddress } from "@/lib/chainPublic";
import { shouldAnimateLaunch } from "@/lib/launchpad/hero-animation";
import styles from "./LaunchMachine.module.css";

const stages = [
  { label: "Your token", title: "An idea becomes a token.", description: "Your name. Your symbol. A fixed supply, created in one transaction." },
  { label: "The pool", title: "Open from the first trade.", description: "100% of the supply enters a Uniswap v4 pool at the starting market cap you choose." },
  { label: "The lock", title: "Liquidity locked. No keys kept.", description: "The liquidity position stays in an ownerless locker forever. Tokens remain tradeable." },
] as const;
const MOTION_QUERY = "(prefers-reduced-motion: no-preference)";
const TILT_QUERY = "(min-width: 1024px) and (hover: hover) and (prefers-reduced-motion: no-preference)";
function subscribeMotion(listener: () => void) {
  const media = window.matchMedia(MOTION_QUERY);
  media.addEventListener("change", listener);
  return () => media.removeEventListener("change", listener);
}
function subscribeVisibility(listener: () => void) {
  document.addEventListener("visibilitychange", listener);
  return () => document.removeEventListener("visibilitychange", listener);
}
const motionSnapshot = () => window.matchMedia(MOTION_QUERY).matches;
const visibilitySnapshot = () => !document.hidden;
const serverSnapshot = () => false;

function useDark() {
  const [dark, setDark] = useState(true);
  useEffect(() => {
    const root = document.documentElement;
    const sync = () => setDark(root.classList.contains("dark"));
    sync();
    const obs = new MutationObserver(sync);
    obs.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);
  return dark;
}

export default function LaunchMachine() {
  const root = useRef<HTMLDivElement>(null);
  const scene = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stage, setStage] = useState(2);
  const [paused, setPaused] = useState(false);
  const [inspecting, setInspecting] = useState(false);
  const [inView, setInView] = useState(false);
  const motionAllowed = useSyncExternalStore(subscribeMotion, motionSnapshot, serverSnapshot);
  const pageVisible = useSyncExternalStore(subscribeVisibility, visibilitySnapshot, serverSnapshot);
  const looping = motionAllowed && !inspecting;
  const playing = shouldAnimateLaunch({ paused, inspecting, motionAllowed, inView, pageVisible });
  const dark = useDark();
  const src = dark ? "/hero-dark.mp4" : "/hero-light.mp4";
  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) => {
      setInView(entry.isIntersecting && entry.intersectionRatio >= 0.15);
    }, { threshold: [0, 0.15] });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (playing) void video.play().catch(() => {});
    else video.pause();
  }, [playing, src]);

  function togglePlayback() {
    if (!motionAllowed) return;
    if (inspecting) {
      setInspecting(false);
      setPaused(false);
      setStage(0);
    } else {
      setPaused((value) => !value);
    }
    scene.current?.style.removeProperty("transform");
  }

  function tilt(event: PointerEvent<HTMLDivElement>) {
    if (paused || event.pointerType !== "mouse" || !window.matchMedia(TILT_QUERY).matches) return;
    const box = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - box.left) / box.width - 0.5;
    const y = (event.clientY - box.top) / box.height - 0.5;
    if (scene.current) scene.current.style.transform = `perspective(1000px) rotateX(${-y * 5}deg) rotateY(${x * 7}deg)`;
  }

  const lockers = CHAIN_KEYS.flatMap((k) => { const locker = launchpad(k).locker; return locker ? [{ chain: k, locker }] : []; });

  return <div ref={root} className={styles.machine} data-stage={stage} data-loop={looping} data-playing={playing}>
    <div className={styles.heading}>
      <span className={styles.eyebrow}><span className={styles.crosshair} aria-hidden /> One transaction. Built to stay.</span>
      <button type="button" onClick={togglePlayback} className={styles.playback} disabled={!motionAllowed} aria-label={!motionAllowed ? "Animation disabled by reduced motion" : paused || inspecting ? "Play video" : "Pause video"}>
        {!motionAllowed ? <span>Motion off</span> : <>{paused || inspecting ? <Play size={12} aria-hidden /> : <Pause size={12} aria-hidden />}<span>{paused || inspecting ? "Play" : "Pause"}</span></>}
      </button>
    </div>
    <div className={styles.viewport} onPointerMove={tilt} onPointerLeave={() => scene.current?.style.removeProperty("transform")}>
      <div ref={scene} className={styles.scene}>
        <div style={{
          background: dark ? "#000000" : "#fafaf8",
          borderRadius: 12,
          overflow: "hidden",
          WebkitMaskImage: "linear-gradient(to bottom, #000 50%, transparent 100%)",
          maskImage: "linear-gradient(to bottom, #000 50%, transparent 100%)",
        }}>
          <video
            key={src}
            ref={videoRef}
            className={styles.drawing}
            src={src}
            autoPlay
            muted
            loop
            playsInline
            style={dark ? undefined : { mixBlendMode: "multiply" }}
          />
        </div>
      </div>
    </div>
    <div className={styles.controls} role="group" aria-label="Explore the launch mechanism">
      {stages.map((item, index) => <button key={item.label} type="button" aria-pressed={stage === index} aria-controls="launch-stage-detail" onClick={() => { setInspecting(true); setPaused(true); setStage(index); scene.current?.style.removeProperty("transform"); }} className={styles.stageButton}>
        <span className={styles.stageNumber}>0{index + 1}</span><span>{item.label}</span><span className={styles.stageDot} aria-hidden />
        <span className={styles.stageProgress} data-phase={index} aria-hidden="true"
          onAnimationStart={() => { if (looping) setStage(index); }}
          onAnimationIteration={() => { if (looping) setStage(index); }} />
      </button>)}
    </div>
    <div id="launch-stage-detail" className={styles.detail} aria-live="off">
      {stages.map((item, index) => <div key={item.label} className={styles.detailContent} aria-hidden={stage !== index}>
        <p className={styles.detailTitle}>{item.title}</p>
        <p className={styles.detailCopy}>{item.description}</p>
      </div>)}
    </div>
    <div className={styles.proof}>
      <span><LockKeyhole size={12} aria-hidden /> Verify the locker</span>
      <span>{lockers.map(({ chain, locker }) => <a key={chain} href={explorerAddress(chain, locker)} target="_blank" rel="noreferrer">{CHAIN_SHORT[chain]} <ArrowUpRight size={11} aria-hidden /></a>)}</span>
    </div>
  </div>;
}








