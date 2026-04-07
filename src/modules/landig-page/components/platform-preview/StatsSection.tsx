"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  LANDING_VIEWPORT,
  landingTransition,
} from "@/modules/landig-page/lib/landingMotion";
import { StatCard } from "./StatCard";

interface StatsSectionProps {
  statsRef: React.RefObject<HTMLDivElement | null>;
}

export const StatsSection: React.FC<StatsSectionProps> = ({ statsRef }) => {
  const reduce = useReducedMotion();

  const containerVariants = {
    hidden: { opacity: reduce ? 1 : 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: reduce ? 0 : 0.09,
        delayChildren: reduce ? 0 : 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { y: reduce ? 0 : 12, opacity: reduce ? 1 : 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: landingTransition(0),
    },
  };

  return (
    <motion.div
      ref={statsRef}
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={LANDING_VIEWPORT}
      className="grid grid-cols-1 md:grid-cols-3 gap-8"
    >
      <motion.div variants={itemVariants}>
        <StatCard
          value="15x"
          description="Higher Conversion Rates"
        />
      </motion.div>

      <motion.div variants={itemVariants}>
        <StatCard
          value="80%"
          description="Less Prospecting Time"
        />
      </motion.div>

      <motion.div variants={itemVariants}>
        <StatCard
          value="78%"
          description="Sales Outperformance"
        />
      </motion.div>
    </motion.div>
  );
};
