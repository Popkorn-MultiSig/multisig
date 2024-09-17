// @ts-nocheck
import styles from '@/styles/Home.module.css';
import { useEffect, useState, useRef } from 'react';

export default function GradientBG({ children }) {
  const canvasRef = useRef(null);
  return (
    <>
      <div className={styles.background}>
        <canvas
          className={styles.backgroundGradients}
          width="6"
          height="6"
          ref={canvasRef}
        />
      </div>
      <div className={styles.container}>{children}</div>
    </>
  );
}
