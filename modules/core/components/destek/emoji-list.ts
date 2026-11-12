// Mesaj alanındaki emoji seçicinin listesi. Destek yazışmalarında ve iş
// iletişiminde işe yarayacak, kategorili bir set — harici paket kullanılmıyor.
// `ikon`, seçicinin üstündeki kategori geçiş çubuğunda gösterilir.

export type EmojiKategori = {
  baslik: string;
  ikon: string;
  emojiler: string[];
};

// Satır başına 8 emoji (seçicideki grid ile aynı) — okunabilsin diye
// prettier'ın her emojiyi ayrı satıra bölmesi kapatıldı.
// prettier-ignore
export const EMOJI_KATEGORILERI: EmojiKategori[] = [
  {
    baslik: "Sık Kullanılanlar",
    ikon: "⭐",
    emojiler: [
      "👍", "🙏", "😊", "👌", "✅", "❌", "⚠️", "👀",
      "🎉", "❤️", "🔥", "💯", "🤝", "📌", "⏳", "💡",
    ],
  },
  {
    baslik: "Yüz İfadeleri",
    ikon: "😀",
    emojiler: [
      "😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣",
      "🙂", "😉", "😊", "😇", "🥰", "😍", "😘", "😋",
      "😎", "🤓", "🤗", "🤔", "🤨", "😐", "😑", "😶",
      "🙄", "😏", "😬", "😌", "😔", "😕", "🙁", "😟",
      "😮", "😲", "😳", "🥺", "😢", "😭", "😤", "😠",
      "😡", "🤯", "😱", "😴", "🤒", "🤕", "🥳", "🤩",
    ],
  },
  {
    baslik: "El Hareketleri",
    ikon: "👋",
    emojiler: [
      "👍", "👎", "👌", "✌️", "🤞", "🤝", "🙏", "👏",
      "🙌", "👋", "✋", "🤚", "👊", "✊", "💪", "🫡",
      "👉", "👈", "👆", "👇", "☝️", "✍️", "🤙", "🫶",
      "🤷", "🙋", "🙆", "🙅", "💁", "🙇", "🤲", "👐",
    ],
  },
  {
    baslik: "İş & Ofis",
    ikon: "💼",
    emojiler: [
      "💼", "🏢", "🏭", "🏦", "🏛️", "🏪", "👔", "🪪",
      "👩‍💼", "👨‍💼", "🧑‍💻", "👷", "👥", "🤝", "🎯", "🏆",
      "📈", "📉", "📊", "🧮", "📌", "📍", "📎", "🖇️",
      "✂️", "🖊️", "✏️", "📝", "🏷️", "🗳️", "🥇", "🎖️",
    ],
  },
  {
    baslik: "Belgeler & Dosyalar",
    ikon: "📁",
    emojiler: [
      "📄", "📃", "📑", "🧾", "📜", "📋", "📁", "📂",
      "🗂️", "🗃️", "🗄️", "📒", "📚", "🔖", "📤", "📥",
      "📦", "📫", "🗑️", "🖨️",
    ],
  },
  {
    baslik: "Para & Finans",
    ikon: "💰",
    emojiler: [
      "💰", "💵", "💶", "💷", "💴", "💳", "🪙", "💸",
      "🏧", "🧾", "💹", "🏦", "🧮", "📊", "💲", "🤑",
    ],
  },
  {
    baslik: "Zaman & İzin",
    ikon: "📅",
    emojiler: [
      "📅", "📆", "🗓️", "⏰", "⏱️", "⏲️", "⌚", "⌛",
      "⏳", "🕐", "🕘", "🕔", "🌅", "🌙", "🏖️", "✈️",
    ],
  },
  {
    baslik: "İletişim",
    ikon: "💬",
    emojiler: [
      "📞", "☎️", "📱", "📲", "💬", "🗨️", "💭", "📧",
      "📨", "📩", "✉️", "📮", "📢", "📣", "🔔", "🔕",
    ],
  },
  {
    baslik: "Teknoloji & Araçlar",
    ikon: "💻",
    emojiler: [
      "💻", "🖥️", "⌨️", "🖱️", "🖨️", "📱", "💾", "🌐",
      "🔌", "🔋", "📡", "🤖", "🐞", "⚙️", "🔧", "🛠️",
      "🔩", "🧰", "🔗", "🔍", "🔎", "🔄", "🔃", "🧪",
    ],
  },
  {
    baslik: "Durum & Semboller",
    ikon: "✅",
    emojiler: [
      "✅", "☑️", "✔️", "❌", "❎", "❗", "❓", "‼️",
      "⚠️", "🚫", "⛔", "🛑", "🚧", "🆗", "🆕", "🆓",
      "🔴", "🟠", "🟡", "🟢", "🔵", "🟣", "⚫", "⚪",
      "⭐", "🌟", "✨", "🔥", "💯", "🚀", "💡", "🎯",
      "🔒", "🔓", "🔐", "🔑", "➕", "➖", "➡️", "⬅️",
      "⬆️", "⬇️", "🔝", "🔜", "🔙", "♻️", "ℹ️", "🆘",
    ],
  },
  {
    baslik: "Kutlama & Kalpler",
    ikon: "🎉",
    emojiler: [
      "🎉", "🎊", "🎈", "🎁", "🎂", "🥂", "🍾", "🏅",
      "❤️", "🧡", "💛", "💚", "💙", "💜", "🤍", "💖",
    ],
  },
];
