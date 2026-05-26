from sarvamai import SarvamAI

client = SarvamAI(
    api_subscription_key="sk_o9wczeqi_xnyKyN5iaYnZ1quumefeGv03"
)

text = """வணக்கம்… நான் ராஜ ராஜ சோழன்.
சோழ பேரரசின் மன்னன் நான்.
தஞ்சை பெரிய கோவிலை கட்டியவன் நான்.
என் வரலாற்றை அறிய நீ வந்துள்ளாய்.
கேள்… நான் சொல்கிறேன்."""

with open("output.mp3", "wb") as f:
    for chunk in client.text_to_speech.convert_stream(
        text=text,
        target_language_code="ta-IN",
        speaker="vijay",   # ✅ correct speaker
        model="bulbul:v3",
        output_audio_codec="mp3",
    ):
        f.write(chunk)

print("Saved!")