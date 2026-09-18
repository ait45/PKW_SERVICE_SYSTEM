"use client";
import React, { useRef, useState, useEffect, useCallback } from "react";
import { Camera, QrCode, PowerOff, CheckCircle2, Zap } from "lucide-react";
import Swal from "sweetalert2";
import { Html5Qrcode } from "html5-qrcode";

interface QRScanningProps {
  onScan: (id: string) => void;
  holiday: boolean;
}

function QRScanning({ onScan, holiday }: QRScanningProps) {
  const [scanning, setScanning] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [torchOn, setTorchOn] = useState<boolean>(false);
  const [torchSupported, setTorchSupported] = useState<boolean>(false);
  const [scanCount, setScanCount] = useState<number>(0);
  const [lastScanned, setLastScanned] = useState<string>("");
  const [showSuccess, setShowSuccess] = useState<boolean>(false);

  const lastScanTime = useRef<number>(0);
  const delay: number = 1500;
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const isScanningRef = useRef<boolean>(false); // ใช้แทน toggle เพื่อป้องกัน bug
  const beepRef = useRef<HTMLAudioElement | null>(null);
  const successTimerRef = useRef<NodeJS.Timeout | null>(null);

  const Toast = Swal.mixin({
    toast: true,
    position: "top",
    showConfirmButton: false,
  });

  // Preload audio ครั้งเดียว
  useEffect(() => {
    beepRef.current = new Audio("/scanner.mp3");
    beepRef.current.preload = "auto";

    if (!html5QrCodeRef.current) {
      html5QrCodeRef.current = new Html5Qrcode("reader");
    }

    return () => {
      // cleanup เมื่อ unmount (เช่น เปลี่ยนหน้า)
      if (isScanningRef.current && html5QrCodeRef.current) {
        Toast.fire({
          title: "กล้องจะปิดใช้งานเมื่อเปลี่ยนหน้า!",
          icon: "warning",
          timer: 2000,
        });
        html5QrCodeRef.current.stop().then(() => {
          html5QrCodeRef.current?.clear();
        }).catch(() => {
          html5QrCodeRef.current?.clear();
        });
        isScanningRef.current = false;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleScan = useCallback((data: string) => {
    // เล่นเสียง
    if (beepRef.current) {
      beepRef.current.currentTime = 0;
      beepRef.current.play().catch(() => { });
    }

    setLastScanned(data);
    setShowSuccess(true);
    setScanCount((c) => c + 1);

    // ซ่อน success indicator หลัง 2.5 วิ
    if (successTimerRef.current) clearTimeout(successTimerRef.current);
    successTimerRef.current = setTimeout(() => {
      setShowSuccess(false);
    }, 2500);

    if (onScan) onScan(data);
  }, [onScan]);

  // ฟังก์ชันเปิด/ปิด Torch
  const toggleTorch = async () => {
    if (!html5QrCodeRef.current || !isScanningRef.current) return;
    try {
      const newState = !torchOn;
      await (html5QrCodeRef.current as any).applyVideoConstraints({
        advanced: [{ torch: newState }],
      });
      setTorchOn(newState);
    } catch {
      Toast.fire({ title: "อุปกรณ์ไม่รองรับไฟฉาย", icon: "error", timer: 2000 });
    }
  };

  // ฟังก์ชันหยุดสแกน
  const stopScanning = async () => {
    try {
      await Toast.fire({
        title: "กล้องกำลังปิด กรุณารอสักครู่",
        timer: 2000,
        didOpen: () => { Swal.showLoading(); },
      });

      if (html5QrCodeRef.current) {
        await html5QrCodeRef.current.stop()
          .then(() => { html5QrCodeRef.current?.clear(); })
          .catch(() => { html5QrCodeRef.current?.clear(); });
      }
      Toast.close();
    } catch (error: any) {
      Swal.fire({
        title: "ไม่สามารถปิดกล้องได้!",
        text: String(error),
        icon: "error",
        timer: 3000,
        showCloseButton: true,
      });
    } finally {
      isScanningRef.current = false;
      setScanning(false);
      setTorchOn(false);
    }
  };

  const startScanning = async () => {
    setLoading(true);
    if (!html5QrCodeRef.current) return;

    Toast.fire({
      title: "กล้องกำลังเปิด กรุณารอสักครู่",
      didOpen: () => { Swal.showLoading(); },
    });

    try {
      const cameras = await Html5Qrcode.getCameras();
      const config = {
        fps: 25,
        qrbox: { width: 220, height: 220 },
        aspectRatio: 1.0,
        showTorchButtonIfSupported: false, // จัดการ torch เองใน UI
      };

      if (cameras && cameras.length) {
        await html5QrCodeRef.current
          .start(
            { facingMode: "environment" },
            config,
            async (decodedText) => {
              const now = Date.now();
              if (now - lastScanTime.current < delay) return;
              lastScanTime.current = now;
              handleScan(decodedText);
            },
            () => { /* parse error — ignore */ }
          )
          .then(() => {
            isScanningRef.current = true;
            setScanning(true);
            Swal.close();
            setLoading(false);

            // ตรวจว่ารองรับ torch หรือไม่
            const track = (html5QrCodeRef.current as any)
              ?.getRunningTrackCapabilities?.();
            if (track?.torch) setTorchSupported(true);
          })
          .catch((err) => {
            setLoading(false);
            Swal.fire({
              title: "เริ่มสแกนไม่ได้!",
              text: String(err),
              timer: 3000,
              icon: "error",
              showConfirmButton: true,
            });
          });
      }
    } catch (error: any) {
      setLoading(false);
      Swal.fire({
        title: "เริ่มสแกนไม่ได้!",
        text: String(error),
        timer: 3000,
        icon: "error",
        showConfirmButton: true,
      });
    }
  };

  return (
    <div
      className={`bg-white rounded-2xl shadow-lg border border-blue-100 p-5 ${loading ? "cursor-wait pointer-events-none" : ""
        }`}
    >
      <div className="max-w-sm mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="bg-blue-500 p-2 rounded-xl shadow-md shadow-blue-200">
              <Camera className="text-white w-5 h-5" />
            </div>
            <div>
              <h2 className="text-blue-700 font-bold text-lg leading-none">QR Scanner</h2>
              <p className="text-blue-400 text-xs">สแกน QR Code เพื่อเช็คชื่อ</p>
            </div>
          </div>

          {/* Scan count badge */}
          {scanCount > 0 && (
            <div className="flex items-center gap-1 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full">
              <CheckCircle2 className="text-emerald-500 w-3.5 h-3.5" />
              <span className="text-emerald-600 text-xs font-semibold">{scanCount} สแกน</span>
            </div>
          )}
        </div>

        {/* Status bar */}
        <div className="flex items-center gap-2 mb-3 bg-blue-50 rounded-lg px-3 py-2">
          <span
            className={`w-2 h-2 rounded-full shrink-0 ${scanning ? "bg-green-400 animate-pulse" : "bg-blue-300"
              }`}
          />
          <span className="text-xs text-blue-600 font-medium">
            {scanning ? "กำลังสแกน..." : loading ? "กำลังเปิดกล้อง..." : "กล้องปิดอยู่"}
          </span>
          {torchSupported && scanning && (
            <button
              onClick={toggleTorch}
              title="เปิด/ปิดไฟฉาย"
              className={`ml-auto flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-colors ${torchOn
                ? "bg-yellow-100 border border-yellow-300 text-yellow-700"
                : "bg-white border border-blue-200 text-blue-500 hover:text-yellow-600 hover:border-yellow-300"
                }`}
            >
              <Zap className="w-3 h-3" />
              {torchOn ? "ปิดไฟ" : "เปิดไฟ"}
            </button>
          )}
        </div>

        {/* Viewfinder */}
        <div className="relative mb-4 rounded-xl overflow-hidden border-2 border-blue-200 shadow-inner">
          {/* Corner brackets overlay */}
          <div className="absolute inset-0 z-10 pointer-events-none">
            {/* top-left */}
            <div className="absolute top-3 left-3 w-8 h-8 border-t-4 border-l-4 border-blue-500 rounded-tl-md" />
            {/* top-right */}
            <div className="absolute top-3 right-3 w-8 h-8 border-t-4 border-r-4 border-blue-500 rounded-tr-md" />
            {/* bottom-left */}
            <div className="absolute bottom-3 left-3 w-8 h-8 border-b-4 border-l-4 border-blue-500 rounded-bl-md" />
            {/* bottom-right */}
            <div className="absolute bottom-3 right-3 w-8 h-8 border-b-4 border-r-4 border-blue-500 rounded-br-md" />

            {/* Scan line animation */}
            {scanning && (
              <div className="absolute left-4 right-4 top-4 bottom-4 overflow-hidden rounded-lg">
                <div className="scan-line" />
              </div>
            )}
          </div>

          {/* Camera feed */}
          <div
            id="reader"
            className="w-full bg-blue-950"
            style={{ minHeight: "280px" }}
          />

          {/* Success flash overlay */}
          {showSuccess && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-emerald-500/20 animate-fade-out">
              <div className="bg-emerald-500 rounded-full p-4 shadow-lg">
                <CheckCircle2 className="text-white w-10 h-10" />
              </div>
            </div>
          )}

          {/* Placeholder เมื่อกล้องปิด */}
          {!scanning && !loading && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-blue-50/95">
              <div className="bg-blue-100 rounded-2xl p-5 mb-3">
                <QrCode className="text-blue-400 w-14 h-14" />
              </div>
              <p className="text-blue-400 text-sm font-medium">กดปุ่ม "เริ่มสแกน" เพื่อเปิดกล้อง</p>
            </div>
          )}
        </div>

        {/* Last scanned result */}
        {lastScanned && (
          <div
            className={`mb-4 px-4 py-3 rounded-xl border transition-all duration-500 ${showSuccess
              ? "bg-emerald-50 border-emerald-200"
              : "bg-blue-50 border-blue-200"
              }`}
          >
            <p className="text-blue-400 text-xs mb-0.5">ผลล่าสุด</p>
            <p
              className={`font-mono text-sm font-semibold truncate ${showSuccess ? "text-emerald-600" : "text-blue-700"
                }`}
            >
              {lastScanned}
            </p>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2">
          {!scanning ? (
            <button
              onClick={startScanning}
              disabled={holiday || loading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-200 disabled:cursor-not-allowed text-white rounded-xl font-semibold text-sm transition-colors shadow-md shadow-blue-200"
            >
              <QrCode className="w-4 h-4" />
              เริ่มสแกน
            </button>
          ) : (
            <button
              onClick={stopScanning}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold text-sm transition-colors shadow-md shadow-red-200"
            >
              <PowerOff className="w-4 h-4" />
              หยุดสแกน
            </button>
          )}
        </div>

        {holiday && (
          <p className="text-center text-rose-500 text-xs mt-3 bg-rose-50 border border-rose-200 rounded-lg py-2">
            ⚠ วันนี้เป็นวันหยุด ไม่สามารถสแกนได้
          </p>
        )}
      </div>

      {/* Styles สำหรับ html5-qrcode video + scan animation */}
      <style>{`
        #reader video {
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
          border-radius: 0.75rem;
        }
        #reader__scan_region img,
        #reader__dashboard_section_csr,
        #reader__header_message {
          display: none !important;
        }
        #reader {
          border: none !important;
        }
        @keyframes scanMove {
          0%   { top: 8%; }
          50%  { top: 88%; }
          100% { top: 8%; }
        }
        .scan-line {
          position: absolute;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent, #3b82f6, #60a5fa, #3b82f6, transparent);
          box-shadow: 0 0 8px 2px rgba(96,165,250,0.6);
          animation: scanMove 2.5s ease-in-out infinite;
          border-radius: 1px;
        }
        @keyframes fadeOut {
          0%   { opacity: 1; }
          70%  { opacity: 1; }
          100% { opacity: 0; }
        }
        .animate-fade-out {
          animation: fadeOut 2.5s ease forwards;
        }
      `}</style>
    </div>
  );
}

export default QRScanning;
