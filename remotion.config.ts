import { Config } from "@remotion/cli/config";

// Every render is exported to Instagram's Reels spec so the upload re-compresses as little as possible:
// 1080x1920 at 30fps (set per composition), H.264, yuv420p, Rec.709 colour, 12 Mbit/s video, AAC 256k.
Config.setCodec("h264");
Config.setPixelFormat("yuv420p");
Config.setColorSpace("bt709");
Config.setVideoBitrate("12M");
Config.setAudioCodec("aac");
Config.setAudioBitrate("256k");
Config.setEnforceAudioTrack(true);
// speed
Config.setConcurrency("100%");
Config.setChromiumOpenGlRenderer("angle");
Config.setHardwareAcceleration("if-possible");
