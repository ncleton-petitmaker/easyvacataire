import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "EasyVacataire - Simplifiez la gestion de vos intervenants vacataires";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          background: "linear-gradient(135deg, #FAFAF9 0%, #F0F0EE 100%)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background blobs */}
        <div
          style={{
            position: "absolute",
            top: "-100px",
            right: "-50px",
            width: "400px",
            height: "400px",
            borderRadius: "50%",
            background: "rgba(199, 210, 254, 0.4)",
            filter: "blur(80px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-80px",
            left: "-30px",
            width: "350px",
            height: "350px",
            borderRadius: "50%",
            background: "rgba(253, 230, 138, 0.3)",
            filter: "blur(80px)",
          }}
        />

        {/* Logo mark */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "40px",
          }}
        >
          <svg
            width="48"
            height="48"
            viewBox="720 70 230 250"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fill="rgb(66,67,196)"
              d="M 927.755 79.2495 C 933.944 78.724 938.946 78.2913 942.961 83.9429 C 942.891 90.3048 934.081 91.3977 929.206 94.9764 C 875.164 134.643 858.327 214.128 834.293 273.434 C 829.223 288.112 821.57 300.264 805.002 303.713 C 770.44 310.908 758.986 258.042 748.009 232.701 C 742.878 220.883 737.372 211.206 730.84 200.245 C 750.682 176.317 768.735 180.227 781.097 208.038 C 788.156 223.92 794.549 239.535 799.145 256.388 C 801.998 247.152 806.039 237.035 809.65 228.011 C 832.408 171.129 859.217 91.1389 927.755 79.2495 z"
            />
          </svg>
          <span
            style={{
              fontSize: "28px",
              fontWeight: 700,
              color: "#27272a",
              letterSpacing: "-0.02em",
            }}
          >
            EasyVacataire
          </span>
        </div>

        {/* Headline */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            maxWidth: "900px",
            padding: "0 40px",
          }}
        >
          <span
            style={{
              fontSize: "56px",
              fontWeight: 800,
              color: "#18181b",
              lineHeight: 1.15,
              letterSpacing: "-0.03em",
            }}
          >
            Les pros ont l&apos;expertise.
          </span>
          <span
            style={{
              fontSize: "56px",
              fontWeight: 800,
              lineHeight: 1.15,
              letterSpacing: "-0.03em",
              background: "linear-gradient(to right, #4f46e5, #818cf8)",
              backgroundClip: "text",
              color: "transparent",
              marginTop: "4px",
            }}
          >
            Vos étudiants en ont besoin.
          </span>
        </div>

        {/* Subtitle */}
        <p
          style={{
            fontSize: "22px",
            color: "#52525b",
            marginTop: "28px",
            maxWidth: "700px",
            textAlign: "center",
            lineHeight: 1.5,
            padding: "0 40px",
          }}
        >
          Synchronisez les disponibilités des professionnels avec les besoins de
          votre établissement.
        </p>

        {/* Bottom bar */}
        <div
          style={{
            position: "absolute",
            bottom: "0",
            left: "0",
            right: "0",
            height: "6px",
            background: "linear-gradient(to right, #4f46e5, #818cf8, #fbbf24)",
          }}
        />
      </div>
    ),
    { ...size }
  );
}
