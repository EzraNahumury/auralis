# 🎙️ Voiceover Script — Auralis Demo

Ready-to-paste scripts for ElevenLabs (or any TTS). Plain prose, natural pauses, no markdown.

Duration target: ~3 minutes per version.

---

## 🇬🇧 English Version

Copy everything below into ElevenLabs:

---

Hi everyone. We are team Auralis, and today we are presenting our submission for the Portaldot Mini Hackathon Season One.

Let me start with a question. Have you ever heard of Arisan? It is a centuries-old Indonesian tradition where a group of people pool money together regularly, and each round, one member takes home the entire pot. It is simple, communal, and built on trust.

But traditional arisan has problems. The treasurer can disappear with the money. Manual record-keeping leads to disputes. And modern banking, which could solve these issues, still excludes one hundred and eighty million unbanked Indonesians.

This is where Auralis comes in. We bring arisan onto the Portaldot blockchain, with AI agents that validate every withdrawal, and a multisig that secures the pot. A tradition hundreds of years old, rebuilt for Web3.

So why does this matter? First, this is not another DeFi clone. It is a new financial primitive, rooted in local context. Second, we do not mock our AI. We run real large language models as two distinct agents. The Requester Agent processes withdrawal requests with full context. The Reviewer Agent provides voting suggestions per member based on their personal policy preferences. Third, all governance runs through on-chain multisig, not a centralized API. The pot is locked, payouts require threshold signatures, and everything is recorded permanently on chain.

Our stack is simple but powerful. Seven smart contracts written in ink five point x, all deployed on the Portaldot dev chain. A Next dot js sixteen frontend with Polkadot dot js for transaction signing. AI agents powered by Ollama. And multisig two of three to secure pot withdrawals.

Now let me walk you through the demo. Our scenario, Alice needs two hundred POT to cover her child's urgent school fees.

First, I sign in as Alice using a dev key. In production this would be a real wallet like Polkadot dot js or Talisman.

Next, I create a group called Arisan with three members. Alice, Bob, and Charlie. Threshold is two of three, and each member deposits one hundred POT per round.

Now round one begins. Alice deposits one hundred POT. This is a real on-chain transfer to the multisig address. I switch to Bob, and Bob deposits. I switch to Charlie, and Charlie deposits. The pot now holds three hundred POT. Notice the block number incrementing, these are real transactions, not simulations.

Alice now requests a withdrawal of two hundred POT. She provides the reason, my child needs urgent school fees, and selects emergency as the category. The request immediately enters Phase One, AI Pre-Validation.

Watch this carefully. The Requester Agent analyzes the request in real time. It checks deposit history, finds a perfect record. It checks reputation, finds eight hundred eighty seven out of one thousand, Platinum tier. It evaluates the reason and finds it reasonable. The verdict is PASS with ninety percent confidence, fast tracked to voting.

Now Phase Two, member voting. The Reviewer Agent gives personalized suggestions. Bob, with a trust default policy, suggests approve. Charlie, with a conservative policy, also suggests approve. Alice clicks propose on chain, which becomes the first multisig signature. I switch to Bob and click approve and execute. Threshold reached. Status changes to completed.

Now the key moment. I switch back to Alice. Phase Three appears, claim funds. Alice clicks claim two hundred POT.

Look at this. Alice's wallet balance jumps by exactly two hundred POT. The group pot balance drops from three hundred to one hundred. Phase Three turns green with a real transaction hash. This is not animation, this is a verifiable on-chain transfer.

And finally, Phase Four shows the complete history. Propose, approve, execute, and claim. Every step recorded with block numbers and transaction hashes. A full audit trail.

So to summarize, Auralis is a trust-minimized arisan with no treasurer needed. It is AI-augmented governance where two distinct agents assist humans without overriding their decisions. It is native to Portaldot, built with seven ink contracts and POT as gas token, fully on chain. And it is inclusive by design, built for the Indonesian context rather than a copy paste of Western DeFi.

The web app is live at auralis dash portaldot dot vercel dot app. The substrate node runs on Railway. All seven contracts are deployed. Our code is open on GitHub at Ezra Nahumury slash auralis.

That is Auralis. Thank you for watching. We are ready for questions.

---

## 🇮🇩 Versi Bahasa Indonesia

Copy semua di bawah ini ke ElevenLabs:

---

Halo semua. Kami tim Auralis, dan hari ini kami mempersembahkan submission kami untuk Portaldot Mini Hackathon Season Satu.

Mari saya mulai dengan satu pertanyaan. Pernahkah kalian dengar tentang Arisan? Ini adalah tradisi Indonesia berusia ratusan tahun, di mana sekelompok orang patungan secara rutin, dan setiap putaran, satu anggota mendapat giliran membawa pulang seluruh pot. Sederhana, komunal, dibangun di atas kepercayaan.

Tapi arisan tradisional punya masalah. Bendahara bisa kabur membawa uang. Pencatatan manual menyebabkan sengketa. Dan perbankan modern, yang seharusnya bisa menyelesaikan masalah ini, justru masih mengecualikan seratus delapan puluh juta penduduk Indonesia yang unbanked.

Di sinilah Auralis hadir. Kami bawa arisan ke blockchain Portaldot, dengan AI agent yang memvalidasi setiap penarikan, dan multisig yang mengamankan pot. Sebuah tradisi berusia ratusan tahun, dibangun ulang untuk Web tiga.

Kenapa ini penting? Pertama, ini bukan lagi DeFi clone. Ini adalah financial primitive baru yang berakar pada konteks lokal. Kedua, kami tidak mock AI kami. Kami menjalankan large language model nyata sebagai dua agent yang berbeda. Requester Agent memproses pengajuan penarikan dengan konteks penuh. Reviewer Agent memberikan saran voting per anggota berdasarkan policy preference mereka. Ketiga, semua governance berjalan melalui on-chain multisig, bukan API terpusat. Pot dikunci, payout memerlukan threshold signature, dan semuanya tercatat permanen di chain.

Stack kami sederhana tapi powerful. Tujuh smart contract ditulis dalam ink lima titik x, semua deployed di Portaldot dev chain. Frontend Next js enam belas dengan Polkadot js untuk signing transaksi. AI agent yang ditenagai Ollama. Dan multisig dua dari tiga untuk mengamankan pot withdrawal.

Sekarang mari saya tunjukkan demonya. Skenario kami, Alice butuh dua ratus POT untuk biaya sekolah anaknya yang mendadak.

Pertama, saya sign in sebagai Alice menggunakan dev key. Di production ini akan menjadi wallet asli seperti Polkadot js atau Talisman.

Selanjutnya, saya buat group bernama Arisan dengan tiga anggota. Alice, Bob, dan Charlie. Threshold dua dari tiga, dan setiap anggota deposit seratus POT per putaran.

Sekarang putaran satu dimulai. Alice deposit seratus POT. Ini adalah transfer on-chain nyata ke alamat multisig. Saya switch ke Bob, Bob deposit. Saya switch ke Charlie, Charlie deposit. Pot sekarang berisi tiga ratus POT. Perhatikan nomor block yang bertambah, ini transaksi nyata, bukan simulasi.

Alice sekarang mengajukan withdrawal sebesar dua ratus POT. Dia memberikan alasan, anak saya butuh biaya sekolah mendadak, dan memilih kategori emergency. Pengajuan langsung masuk ke Phase Satu, AI Pre-Validation.

Perhatikan baik-baik. Requester Agent menganalisa pengajuan secara real time. Dia cek riwayat deposit, menemukan rekor sempurna. Cek reputation score, menemukan delapan ratus delapan puluh tujuh dari seribu, tier Platinum. Mengevaluasi alasan dan menemukannya masuk akal. Verdict adalah PASS dengan confidence sembilan puluh persen, fast track ke voting.

Sekarang Phase Dua, voting anggota. Reviewer Agent memberikan saran personal. Bob, dengan policy trust default, menyarankan approve. Charlie, dengan policy conservative, juga menyarankan approve. Alice klik propose on chain, ini menjadi signature multisig pertama. Saya switch ke Bob dan klik approve and execute. Threshold tercapai. Status berubah menjadi completed.

Sekarang momen penting. Saya switch kembali ke Alice. Phase Tiga muncul, claim funds. Alice klik claim dua ratus POT.

Lihat ini. Balance Alice langsung naik tepat dua ratus POT. Pot balance group turun dari tiga ratus menjadi seratus. Phase Tiga berubah hijau dengan transaction hash nyata. Ini bukan animasi, ini adalah transfer on-chain yang bisa diverifikasi.

Dan terakhir, Phase Empat menampilkan riwayat lengkap. Propose, approve, execute, dan claim. Setiap langkah tercatat dengan nomor block dan transaction hash. Audit trail penuh.

Jadi rangkumannya, Auralis adalah arisan yang trust minimized tanpa perlu bendahara. Ini adalah AI augmented governance di mana dua agent berbeda membantu manusia tanpa mengambil alih keputusan mereka. Ini native ke Portaldot, dibangun dengan tujuh ink contract dan POT sebagai gas token, sepenuhnya on chain. Dan ini inklusif by design, dibangun untuk konteks Indonesia, bukan copy paste dari DeFi Barat.

Web app sudah live di auralis dash portaldot dot vercel dot app. Substrate node berjalan di Railway. Semua tujuh contract sudah deployed. Code kami terbuka di GitHub Ezra Nahumury slash auralis.

Itulah Auralis. Terima kasih sudah menonton. Kami siap untuk pertanyaan.

---

## 📌 Tips Pakai di ElevenLabs

1. **Voice pilihan:**
   - English: pilih voice Indonesian-accent atau natural American/British
   - Indonesia: pilih voice yang mendukung bahasa Indonesia (sebagian voice ElevenLabs sudah multilingual)

2. **Settings recommended:**
   - Stability: 0.50 - 0.65
   - Similarity: 0.70 - 0.80
   - Style exaggeration: 0.0 - 0.25
   - Use speaker boost: ON

3. **Edit setelah generate:**
   - Singkat-singkat per paragraf agar pacing pas
   - Tambah pause antar section dengan inserting "..." (3 dots) di tempat-tempat penting

4. **Durasi target:**
   - English: ~2:45 - 3:15
   - Indonesia: ~3:00 - 3:30

5. **Sync ke demo screen recording:**
   - Rekam screen demo dulu (60-90 detik)
   - Generate voiceover full version (3 menit)
   - Edit di Capcut/Premiere: cut bagian intro/outro yang tidak perlu screen demo, atau split screen
