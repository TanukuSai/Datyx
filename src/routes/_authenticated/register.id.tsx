import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Camera, RefreshCw, Upload, CheckCircle2, AlertCircle, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/_authenticated/register/id")({
  head: () => ({
    meta: [
      { title: "Register ID — DATYX" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: RegisterId,
});

function RegisterId() {
  const navigate = useNavigate();
  
  // ID Upload State
  const [frontImage, setFrontImage] = useState<string | null>(null);
  const [backImage, setBackImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("");

  // Extracted/Confirmation State
  const [step, setStep] = useState<"upload" | "confirm">("upload");
  const [formData, setFormData] = useState({
    full_name: "",
    roll_no: "",
    phone: "",
    valid_until: "",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isManualEntry, setIsManualEntry] = useState(false);

  const frontInputRef = useRef<HTMLInputElement>(null);
  const backInputRef = useRef<HTMLInputElement>(null);

  // Camera Capture States
  const [activeCameraSlot, setActiveCameraSlot] = useState<"front" | "back" | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const activeStreamRef = useRef<MediaStream | null>(null);

  // Stop camera helper and turn off green webcam light completely
  const stopCamera = () => {
    if (activeStreamRef.current) {
      activeStreamRef.current.getTracks().forEach((track) => {
        track.stop();
      });
      activeStreamRef.current = null;
    }
    setActiveCameraSlot(null);
  };

  // Start camera stream
  const startCamera = async (slot: "front" | "back") => {
    if (activeStreamRef.current) {
      stopCamera();
    }
    setActiveCameraSlot(slot);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      activeStreamRef.current = stream;
      
      // Allow DOM to update first so videoRef element is present
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 50);
    } catch (err) {
      console.error("Camera access failed:", err);
      toast.error("Could not access camera. Please upload an image instead.");
      setActiveCameraSlot(null);
    }
  };

  // Capture current video frame and release webcam access immediately
  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video || !activeCameraSlot) return;

    try {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Could not get canvas context");
      
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
      
      if (activeCameraSlot === "front") {
        setFrontImage(dataUrl);
      } else {
        setBackImage(dataUrl);
      }
      toast.success(`${activeCameraSlot === "front" ? "Front" : "Back"} ID captured.`);
    } catch (e) {
      console.error("Capture error:", e);
      toast.error("Failed to capture photo.");
    } finally {
      // Ensure webcam stream is fully stopped and indicator light turns off
      stopCamera();
    }
  };

  // Ensure camera tracks are stopped if the user navigates away or component unmounts
  useEffect(() => {
    return () => {
      if (activeStreamRef.current) {
        activeStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);


  // Downscale image client-side via canvas
  const downscaleImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;
          const maxLongEdge = 1500;

          if (width > height) {
            if (width > maxLongEdge) {
              height = Math.round((height * maxLongEdge) / width);
              width = maxLongEdge;
            }
          } else {
            if (height > maxLongEdge) {
              width = Math.round((width * maxLongEdge) / height);
              height = maxLongEdge;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            reject(new Error("Could not get 2D canvas context"));
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);

          // Return base64 string
          const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
          resolve(dataUrl);
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, slot: "front" | "back") => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file.");
      return;
    }

    try {
      setLoading(true);
      setLoadingMsg("Downscaling image...");
      const base64Str = await downscaleImage(file);
      if (slot === "front") {
        setFrontImage(base64Str);
      } else {
        setBackImage(base64Str);
      }
      toast.success(`${slot === "front" ? "Front" : "Back"} ID image loaded.`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to process image.");
    } finally {
      setLoading(false);
      setLoadingMsg("");
    }
  };

  const triggerUpload = (slot: "front" | "back") => {
    if (slot === "front") {
      frontInputRef.current?.click();
    } else {
      backInputRef.current?.click();
    }
  };

  // Submit to verify-id edge function
  const handleUploadSubmit = async () => {
    if (!frontImage || !backImage) return;

    setLoading(true);
    setLoadingMsg("Extracting details from ID (pixtral-12b is reading)...");
    
    try {
      const { data, error } = await supabase.functions.invoke("verify-id", {
        body: { front: frontImage, back: backImage },
      });

      if (error || !data) {
        throw error || new Error("Failed to extract details from ID");
      }

      setFormData({
        full_name: data.full_name || "",
        roll_no: data.roll_no || "",
        phone: data.phone || "",
        valid_until: data.valid_until || "",
      });
      setIsManualEntry(false);
      setStep("confirm");
      toast.success("ID analyzed successfully!");
    } catch (err) {
      console.error("ID verification error:", err);
      toast.error("We couldn't read your ID. Please enter details manually.");
      setFormData({
        full_name: "",
        roll_no: "",
        phone: "",
        valid_until: "",
      });
      setIsManualEntry(true);
      setStep("confirm");
    } finally {
      setLoading(false);
      setLoadingMsg("");
    }
  };

  // Final verification form validations
  const validateForm = () => {
    const errs: Record<string, string> = {};
    if (!formData.full_name.trim()) {
      errs.full_name = "Full name is required";
    }
    
    const upperRoll = formData.roll_no.trim().toUpperCase();
    const rollNoRegex = /^[0-9]{2}[A-Z][0-9]{2}[A-Z][0-9]{4}$/;
    if (!formData.roll_no.trim()) {
      errs.roll_no = "Roll number is required";
    } else if (!rollNoRegex.test(upperRoll)) {
      errs.roll_no = "Must match format: 24R91A6760";
    }

    const currentYear = new Date().getFullYear();
    const validYear = parseInt(formData.valid_until.trim(), 10);
    if (!formData.valid_until.trim()) {
      errs.valid_until = "Validity year is required";
    } else if (isNaN(validYear) || validYear < currentYear || validYear > currentYear + 6) {
      errs.valid_until = `Must be between ${currentYear} and ${currentYear + 6}`;
    }

    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Submit to submit-registration edge function
  const handleConfirmSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setLoadingMsg("Submitting registration...");

    try {
      const { data, error } = await supabase.functions.invoke("submit-registration", {
        body: {
          full_name: formData.full_name,
          roll_no: formData.roll_no,
          phone: formData.phone,
          valid_until: formData.valid_until,
        },
      });

      if (error || !data) {
        throw error || new Error("Failed to submit registration");
      }

      toast.success("Registration submitted!");
      if (data.is_csds) {
        navigate({ to: "/registration-complete", replace: true });
      } else {
        navigate({ to: "/payment", replace: true });
      }
    } catch (err: any) {
      console.error("Registration submission error:", err);
      const errMsg = err?.message || "Failed to submit registration. Check details.";
      toast.error(errMsg);
      setFormErrors({ roll_no: errMsg });
    } finally {
      setLoading(false);
      setLoadingMsg("");
    }
  };

  if (loading) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-4 py-20 text-center">
        <div className="w-full rounded-xl border border-border bg-surface p-8 shadow-card">
          <div className="relative mx-auto mb-6 h-16 w-16">
            <div className="absolute inset-0 animate-ping rounded-full bg-primary/10" />
            <div className="absolute inset-0 grid place-items-center rounded-full bg-primary/15 text-primary text-xl">
              <Camera className="animate-pulse" />
            </div>
          </div>
          <h2 className="font-display text-2xl font-bold">Scanning ID</h2>
          <p className="mt-3 text-sm text-muted-foreground">{loadingMsg}</p>
          <div className="mx-auto mt-6 max-w-[200px] overflow-hidden rounded-full bg-secondary h-1.5">
            <div className="h-full bg-primary animate-progress-indeterminate rounded-full w-2/3" />
          </div>
        </div>
      </div>
    );
  }

  if (step === "confirm") {
    return (
      <div className="mx-auto flex min-h-[80vh] max-w-md items-center px-4 py-12">
        <div className="w-full rounded-xl border border-border bg-surface p-8 shadow-card">
          <h1 className="font-display text-2xl font-bold">Confirm details</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isManualEntry
              ? "We couldn't read your ID. Please enter your details manually."
              : "Check these details from your ID and correct anything wrong."}
          </p>

          <form onSubmit={handleConfirmSubmit} className="mt-6 space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Full Name</label>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="input w-full"
                placeholder="e.g. JOHN DOE"
                maxLength={80}
              />
              {formErrors.full_name && <p className="mt-1 text-xs text-destructive">{formErrors.full_name}</p>}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Roll Number</label>
              <input
                type="text"
                value={formData.roll_no}
                onChange={(e) => setFormData({ ...formData, roll_no: e.target.value })}
                className="input w-full uppercase"
                placeholder="e.g. 24R91A6760"
                maxLength={10}
              />
              {formErrors.roll_no && <p className="mt-1 text-xs text-destructive">{formErrors.roll_no}</p>}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Phone Number (optional)</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="input w-full"
                placeholder="e.g. 9876543210"
                maxLength={15}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Valid Until (Year)</label>
              <input
                type="text"
                value={formData.valid_until}
                onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                className="input w-full"
                placeholder="e.g. 2028"
                maxLength={4}
              />
              {formErrors.valid_until && <p className="mt-1 text-xs text-destructive">{formErrors.valid_until}</p>}
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-primary to-accent px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow hover:opacity-90"
              >
                Confirm & Continue <ArrowRight className="h-4 w-4" />
              </button>
            </div>
            
            <div className="text-center">
              <button
                type="button"
                onClick={() => setStep("upload")}
                className="text-xs text-muted-foreground hover:underline"
              >
                ← Back to Upload
              </button>
            </div>
          </form>
        </div>
        <style>{`.input{width:100%;border-radius:0.5rem;border:1px solid var(--color-border);background:var(--color-input);padding:0.6rem 0.8rem;font-size:0.9rem;color:var(--color-foreground);outline:none;transition:border-color .15s}.input:focus{border-color:var(--color-primary)}`}</style>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[85vh] max-w-xl flex-col items-center justify-center px-4 py-16">
      <div className="w-full rounded-xl border border-border bg-surface p-8 shadow-card">
        <h1 className="font-display text-3xl font-bold">Verify Student ID</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Upload or capture both the FRONT and BACK sides of your College ID Card to activate your account.
        </p>

        {/* Upload slots */}
        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          {/* Front Side */}
          <div className="flex flex-col items-center">
            <div className="mb-2 text-sm font-medium">ID Card — Front</div>
            <input
              type="file"
              ref={frontInputRef}
              onChange={(e) => handleFileChange(e, "front")}
              accept="image/*"
              className="hidden"
            />
            
            {activeCameraSlot === "front" ? (
              <div className="relative aspect-[3/2] w-full overflow-hidden rounded-lg border-2 border-primary bg-black">
                <video 
                  ref={videoRef} 
                  className="h-full w-full object-cover" 
                  autoPlay 
                  playsInline 
                  muted 
                />
                <div className="absolute bottom-2 inset-x-0 flex justify-center gap-2 px-4 z-20">
                  <button 
                    type="button"
                    onClick={capturePhoto}
                    className="rounded-full bg-accent text-white px-3 py-1.5 text-xs font-bold shadow-glow hover:opacity-90 flex items-center gap-1"
                  >
                    📸 Capture
                  </button>
                  <button 
                    type="button"
                    onClick={stopCamera}
                    className="rounded-full bg-white text-black px-3 py-1.5 text-xs font-bold hover:bg-secondary border border-border"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : frontImage ? (
              <div className="group relative aspect-[3/2] w-full overflow-hidden rounded-lg border border-border bg-background">
                <img src={frontImage} alt="ID Front Preview" className="h-full w-full object-cover" />
                <div className="absolute inset-0 flex flex-col gap-2 items-center justify-center bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    onClick={() => startCamera("front")}
                    className="flex items-center gap-1.5 rounded-full bg-accent px-3 py-1.5 text-[11px] font-semibold text-white hover:opacity-90"
                  >
                    📸 Capture with Camera
                  </button>
                  <button
                    onClick={() => triggerUpload("front")}
                    className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[11px] font-semibold text-black hover:bg-secondary"
                  >
                    📁 Upload File
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex aspect-[3/2] w-full flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-background/60 p-4">
                <Camera className="h-8 w-8 text-muted-foreground mb-3" />
                <div className="flex flex-col gap-2 w-full max-w-[160px]">
                  <button
                    type="button"
                    onClick={() => startCamera("front")}
                    className="rounded-full bg-primary text-primary-foreground px-3 py-1.5 text-[11px] font-semibold hover:opacity-90"
                  >
                    📸 Use Camera
                  </button>
                  <button
                    type="button"
                    onClick={() => triggerUpload("front")}
                    className="rounded-full border border-border bg-white text-black px-3 py-1.5 text-[11px] font-semibold hover:bg-secondary"
                  >
                    📁 Upload Photo
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Back Side */}
          <div className="flex flex-col items-center">
            <div className="mb-2 text-sm font-medium">ID Card — Back</div>
            <input
              type="file"
              ref={backInputRef}
              onChange={(e) => handleFileChange(e, "back")}
              accept="image/*"
              className="hidden"
            />

            {activeCameraSlot === "back" ? (
              <div className="relative aspect-[3/2] w-full overflow-hidden rounded-lg border-2 border-primary bg-black">
                <video 
                  ref={videoRef} 
                  className="h-full w-full object-cover" 
                  autoPlay 
                  playsInline 
                  muted 
                />
                <div className="absolute bottom-2 inset-x-0 flex justify-center gap-2 px-4 z-20">
                  <button 
                    type="button"
                    onClick={capturePhoto}
                    className="rounded-full bg-accent text-white px-3 py-1.5 text-xs font-bold shadow-glow hover:opacity-90 flex items-center gap-1"
                  >
                    📸 Capture
                  </button>
                  <button 
                    type="button"
                    onClick={stopCamera}
                    className="rounded-full bg-white text-black px-3 py-1.5 text-xs font-bold hover:bg-secondary border border-border"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : backImage ? (
              <div className="group relative aspect-[3/2] w-full overflow-hidden rounded-lg border border-border bg-background">
                <img src={backImage} alt="ID Back Preview" className="h-full w-full object-cover" />
                <div className="absolute inset-0 flex flex-col gap-2 items-center justify-center bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    onClick={() => startCamera("back")}
                    className="flex items-center gap-1.5 rounded-full bg-accent px-3 py-1.5 text-[11px] font-semibold text-white hover:opacity-90"
                  >
                    📸 Capture with Camera
                  </button>
                  <button
                    onClick={() => triggerUpload("back")}
                    className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[11px] font-semibold text-black hover:bg-secondary"
                  >
                    📁 Upload File
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex aspect-[3/2] w-full flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-background/60 p-4">
                <Camera className="h-8 w-8 text-muted-foreground mb-3" />
                <div className="flex flex-col gap-2 w-full max-w-[160px]">
                  <button
                    type="button"
                    onClick={() => startCamera("back")}
                    className="rounded-full bg-primary text-primary-foreground px-3 py-1.5 text-[11px] font-semibold hover:opacity-90"
                  >
                    📸 Use Camera
                  </button>
                  <button
                    type="button"
                    onClick={() => triggerUpload("back")}
                    className="rounded-full border border-border bg-white text-black px-3 py-1.5 text-[11px] font-semibold hover:bg-secondary"
                  >
                    📁 Upload Photo
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-4 border-t border-dashed border-black/20 pt-6">
          <div className="flex items-start gap-2 text-xs text-muted-foreground">
            <AlertCircle className="h-4 w-4 shrink-0 text-accent" />
            <p>Ensure the photos are clear and details such as Name, Roll Number, and Expiry Year are readable.</p>
          </div>

          <button
            onClick={handleUploadSubmit}
            disabled={!frontImage || !backImage}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-primary to-accent px-4 py-3 text-sm font-semibold text-primary-foreground shadow-glow hover:opacity-90 disabled:opacity-50"
          >
            Scan & Verify ID <CheckCircle2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
