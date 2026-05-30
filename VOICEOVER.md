# 🎙️ Voiceover Script — Auralis Demo

Ready-to-paste scripts for ElevenLabs (or any TTS). Plain prose, natural pauses, no markdown.

Both versions cover: intro, the four main menu features (Home, Groups, Profile, Agent), live demo with the group called Arisan having three members (Alice, Bob, Charlie), and closing.

Duration target: about 3 to 4 minutes per version.

---

## 🇬🇧 English Version

Copy everything below into ElevenLabs:

---

Hello everyone. We are team Auralis, and today we are presenting our submission for the Portaldot Mini Hackathon Season One.

Let me start with a simple question. Have you ever heard of Arisan? It is a centuries-old Indonesian tradition where a small group of people pool money together regularly, and each round, one member takes home the entire pot. It is simple, communal, and built entirely on trust.

But traditional arisan has real problems. The treasurer can disappear with the money. Manual record-keeping often leads to disputes. And while modern banking could solve these issues, it still excludes one hundred and eighty million unbanked Indonesians.

This is where Auralis comes in. We bring arisan onto the Portaldot blockchain, paired with AI agents that validate every withdrawal request, and a multisig wallet that secures the shared pot. A tradition hundreds of years old, rebuilt for the Web Three era.

Why does this matter? First, this is not another DeFi clone. It is a brand-new financial primitive, rooted in local culture. Second, we do not fake our AI. We run a real large language model as two distinct agents. The Requester Agent processes withdrawal requests with full context. The Reviewer Agent provides voting suggestions for each member based on their personal policy preference. Third, all governance flows through on-chain multisig, not a centralized API. The pot is locked, payouts require threshold signatures, and every action is recorded permanently on chain.

Before the live demo, let me walk you through the four main menu features of the application.

The first menu is Home. This is your personalized dashboard. When you sign in, Auralis greets you, shows the groups you belong to, and lists every pending action you need to take. If you have a deposit due this round, it appears here. If there is a withdrawal vote waiting for you, it appears here too. Home is designed so you always know what to do next, in one glance.

The second menu is Groups. This is where you create new arisan groups and browse the ones you are already in. Each group card displays the multisig address, the current round, total members, and the pot status. From here you can open any group to deposit, request a withdrawal, or vote on someone else's request.

The third menu is Profile. This shows your on-chain identity in Auralis. You will see your trust score out of one thousand, your tier such as Platinum or Gold, your vote weight multiplier, and the number of groups you actively participate in. We also display your earned reputation badges. Your Profile is what other members see when evaluating your withdrawal requests.

The fourth menu is Agent. This is where you configure your personal AI reviewer. You can pick from three policy presets. Careful, which approves only when every signal is clean. Balanced, the default, which approves when reputation, payment history, and reason all line up. And Emergencies only, which approves strictly for verified emergencies like hospital, accident, or school fee deadlines. This way, the AI votes on your behalf according to your values, not a one-size-fits-all rule.

Now let me walk you through the live demo. Our scenario, Alice needs two hundred POT to cover her child's urgent school fees.

First, I sign in as Alice using a dev key. In production this would be a real wallet like Polkadot dot js or Talisman.

Next, I create a group called Arisan with three members. Alice, Bob, and Charlie. The threshold is two of three, and each member deposits one hundred POT per round.

Now round one begins. Alice deposits one hundred POT. This is a real on-chain transfer to the multisig address. I switch to Bob, and Bob deposits. I switch to Charlie, and Charlie deposits. The pot now holds three hundred POT. Notice the block number incrementing on screen, these are real transactions, not simulations.

Alice now requests a withdrawal of two hundred POT. She provides her reason, my child needs urgent school fees, and selects emergency as the category. The request immediately enters Phase One, AI Pre-Validation.

Watch carefully. The Requester Agent analyzes the request in real time. It checks deposit history and finds a perfect record. It checks reputation, finding eight hundred eighty seven out of one thousand, Platinum tier. It evaluates the reason and finds it reasonable. The verdict is PASS with ninety percent confidence, fast tracked to voting.

Now Phase Two, member voting. The Reviewer Agent gives personalized suggestions for each member. Bob, on a Balanced policy, suggests approve. Charlie, on a Careful policy, also suggests approve. Alice clicks propose on chain, becoming the first multisig signature. I switch to Bob and click approve and execute. The threshold is reached. Status changes to completed.

Now the key moment. I switch back to Alice. Phase Three appears, claim funds. Alice clicks claim two hundred POT.

Look at this. Alice's wallet balance jumps by exactly two hundred POT. The group pot balance drops from three hundred to one hundred. Phase Three turns green with a real transaction hash. This is not animation, this is a verifiable on-chain transfer.

And finally, Phase Four shows the complete on-chain history. Propose, approve, execute, and claim. Every step recorded with block numbers and transaction hashes. A full audit trail.

So to summarize, Auralis is a trust-minimized arisan that needs no treasurer. It is AI-augmented governance where two distinct agents assist humans without overriding their decisions. It is native to Portaldot, built with seven ink contracts using POT as the gas token, fully on chain. And it is inclusive by design, built for the Indonesian context rather than a copy paste of Western DeFi.

Our web app is live at auralis dash portaldot dot vercel dot app. The substrate node runs on Railway. All seven contracts are deployed. Our code is open source on GitHub.

That is Auralis. Thank you for watching. We are ready for your questions.

---

## 🇮🇩 Versi Bahasa Indonesia

Copy semua di bawah ini ke ElevenLabs:

---

Halo semuanya. Kami adalah tim Auralis, dan hari ini kami mempersembahkan submission kami untuk Portaldot Mini Hackathon Season Satu.

Saya ingin mulai dengan satu pertanyaan sederhana. Pernahkah kalian mengikuti Arisan? Arisan adalah tradisi Indonesia yang sudah berusia ratusan tahun, di mana sekelompok kecil orang menyetor uang secara rutin, lalu setiap putaran, satu anggota mendapat giliran membawa pulang seluruh pot. Sederhana, kekeluargaan, dan sepenuhnya dibangun di atas kepercayaan.

Tetapi arisan tradisional punya masalah nyata. Bendahara bisa kabur membawa uang anggota. Pencatatan manual sering memicu sengketa. Dan walaupun perbankan modern bisa menyelesaikan masalah ini, perbankan tetap mengecualikan seratus delapan puluh juta penduduk Indonesia yang belum tersentuh layanan bank.

Di sinilah Auralis hadir. Kami memindahkan arisan ke blockchain Portaldot, dipadukan dengan AI agent yang memvalidasi setiap pengajuan penarikan, dan dompet multisig yang mengamankan pot bersama. Sebuah tradisi berusia ratusan tahun, dibangun kembali untuk era Web Tiga.

Mengapa ini penting? Pertama, ini bukan sekadar tiruan DeFi. Ini adalah financial primitive baru yang berakar pada budaya lokal. Kedua, kami tidak memalsukan AI kami. Kami menjalankan large language model nyata sebagai dua agent yang berbeda. Requester Agent memproses pengajuan penarikan dengan konteks lengkap. Reviewer Agent memberikan saran voting untuk setiap anggota berdasarkan policy pribadi mereka. Ketiga, seluruh governance berjalan melalui on-chain multisig, bukan API terpusat. Pot terkunci, payout memerlukan threshold tanda tangan, dan setiap tindakan tercatat secara permanen di chain.

Sebelum demo langsung, izinkan saya menjelaskan empat menu utama dari aplikasi ini.

Menu pertama adalah Home. Ini adalah dashboard pribadi kalian. Saat sign in, Auralis menyapa pengguna, menampilkan daftar group yang diikuti, dan mencantumkan setiap tindakan yang masih perlu dilakukan. Jika ada deposit yang harus dibayar di putaran ini, akan muncul di sini. Jika ada pengajuan penarikan yang menunggu vote dari kalian, juga muncul di sini. Home dirancang supaya pengguna selalu tahu apa langkah selanjutnya, hanya dengan sekali lihat.

Menu kedua adalah Groups. Di sinilah kalian membuat group arisan baru dan melihat group yang sudah diikuti. Setiap kartu group menampilkan alamat multisig, putaran berjalan, jumlah anggota, dan status pot. Dari halaman ini kalian bisa membuka group manapun untuk melakukan deposit, mengajukan penarikan, atau memberi vote pada pengajuan anggota lain.

Menu ketiga adalah Profile. Halaman ini menampilkan identitas on-chain kalian di Auralis. Kalian akan melihat trust score dari skala seribu, tier seperti Platinum atau Gold, vote weight multiplier, dan jumlah group yang sedang aktif kalian ikuti. Kami juga menampilkan reputation badge yang telah kalian peroleh. Profile inilah yang dilihat anggota lain saat menilai pengajuan penarikan kalian.

Menu keempat adalah Agent. Di sinilah kalian mengatur AI reviewer pribadi. Kalian bisa memilih dari tiga preset policy. Careful, yang hanya menyetujui jika semua sinyal benar-benar bersih. Balanced, default, yang menyetujui ketika reputasi, riwayat pembayaran, dan alasan sama-sama mendukung. Dan Emergencies only, yang hanya menyetujui untuk keadaan darurat terverifikasi seperti rumah sakit, kecelakaan, atau tenggat biaya sekolah. Dengan begini, AI akan memberi vote atas nama kalian sesuai nilai pribadi, bukan aturan seragam.

Sekarang mari saya tunjukkan demo langsungnya. Skenario kami, Alice membutuhkan dua ratus POT untuk biaya sekolah anaknya yang mendesak.

Pertama, saya sign in sebagai Alice menggunakan dev key. Di production, ini akan menjadi wallet asli seperti Polkadot js atau Talisman.

Selanjutnya, saya membuat group bernama Arisan dengan tiga anggota. Alice, Bob, dan Charlie. Threshold dua dari tiga, dan setiap anggota menyetor seratus POT per putaran.

Sekarang putaran satu dimulai. Alice menyetor seratus POT. Ini adalah transfer on-chain nyata ke alamat multisig. Saya beralih ke Bob, Bob menyetor. Lalu beralih ke Charlie, Charlie menyetor. Pot sekarang berisi tiga ratus POT. Perhatikan nomor block yang terus bertambah di layar, ini transaksi nyata, bukan simulasi.

Alice kemudian mengajukan penarikan sebesar dua ratus POT. Ia menulis alasannya, anak saya butuh biaya sekolah yang mendesak, dan memilih kategori emergency. Pengajuan langsung masuk ke Phase Satu, AI Pre-Validation.

Perhatikan baik-baik. Requester Agent menganalisa pengajuan secara real time. Ia memeriksa riwayat deposit dan menemukan rekor sempurna. Ia mengecek reputation score dan menemukan delapan ratus delapan puluh tujuh dari seribu, tier Platinum. Ia mengevaluasi alasan dan menilai masuk akal. Verdictnya adalah PASS dengan tingkat kepercayaan sembilan puluh persen, dipercepat menuju voting.

Sekarang Phase Dua, voting anggota. Reviewer Agent memberi saran personal untuk setiap anggota. Bob, dengan policy Balanced, menyarankan approve. Charlie, dengan policy Careful, juga menyarankan approve. Alice klik propose on chain, menjadi tanda tangan multisig pertama. Saya beralih ke Bob dan klik approve and execute. Threshold tercapai. Status berubah menjadi completed.

Sekarang momen pentingnya. Saya kembali sign in sebagai Alice. Muncul Phase Tiga, claim funds. Alice klik claim dua ratus POT.

Perhatikan ini. Saldo dompet Alice langsung bertambah tepat dua ratus POT. Pot balance group turun dari tiga ratus menjadi seratus. Phase Tiga berubah hijau dengan transaction hash yang nyata. Ini bukan animasi, ini adalah transfer on-chain yang bisa diverifikasi.

Dan terakhir, Phase Empat menampilkan riwayat on-chain lengkap. Propose, approve, execute, dan claim. Setiap langkah tercatat dengan nomor block dan transaction hash. Jejak audit yang utuh.

Jadi kesimpulannya, Auralis adalah arisan yang trust minimized tanpa perlu bendahara. Auralis adalah AI augmented governance di mana dua agent berbeda membantu manusia tanpa mengambil alih keputusan mereka. Auralis dibangun secara native untuk Portaldot, dengan tujuh ink contract menggunakan POT sebagai gas token, sepenuhnya on chain. Dan Auralis inklusif by design, dirancang untuk konteks Indonesia, bukan jiplakan DeFi Barat.

Web app kami sudah live di auralis dash portaldot dot vercel dot app. Substrate node berjalan di Railway. Tujuh smart contract sudah terdeploy. Kode kami terbuka di GitHub.

Itulah Auralis. Terima kasih sudah menyimak. Kami siap menerima pertanyaan dari kalian.

---

## 📌 Tips Menggunakan di ElevenLabs

1. **Pemilihan suara:**
   - English: pilih voice American atau British natural, atau multilingual voice
   - Indonesia: pilih voice multilingual yang mendukung bahasa Indonesia

2. **Setting yang direkomendasikan:**
   - Stability: 0.50 hingga 0.65
   - Similarity: 0.70 hingga 0.80
   - Style exaggeration: 0.0 hingga 0.25
   - Speaker boost: ON

3. **Edit setelah di-generate:**
   - Potong per bagian agar pacing pas
   - Tambahkan jeda dengan menyisipkan tiga titik di tempat penting

4. **Target durasi:**
   - English: sekitar 3 sampai 3 setengah menit
   - Indonesia: sekitar 3 setengah sampai 4 menit

5. **Sinkronisasi dengan rekaman demo:**
   - Rekam screen demo terlebih dahulu, sekitar 60 sampai 90 detik
   - Generate voiceover versi lengkap, sekitar 3 hingga 4 menit
   - Edit di CapCut atau Premiere, potong bagian intro dan outro yang tidak perlu screen demo, atau pakai split screen
