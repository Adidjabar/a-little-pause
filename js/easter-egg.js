document.addEventListener("DOMContentLoaded", () => {
    const $ = (id) => document.getElementById(id);

    const overlay = $("eggOverlay");
    const card = $("eggCard");
    const closeButton = $("eggClose");
    const nextButton = $("eggNext");
    const smallText = $("eggSmall");
    const titleText = $("eggTitle");
    const poemText = $("eggPoem");
    const finalText = $("eggFinal");
    const backdrop = overlay ? overlay.querySelector(".egg-backdrop") : null;

    if (![overlay, card, backdrop, closeButton, nextButton,
          smallText, titleText, poemText, finalText].every(Boolean)) {
        return;
    }

    const TOTAL_EGGS = 11;
    const NEED_BEFORE_LAST = 10;
    const LAST_ID = "11";
    const STORE_KEY = "alpFound";

    const discoveries = {
        "01": {
            small: "Bintang ini kedip-kedip nakal. Tenang, dia bukan kasih kode, cuma sedang menyala.",
            title: "Bahkan cahaya pun butuh waktu untuk sampai.",
            poem:
`Cahaya bintang yang singgah di matamu malam ini berangkat ratusan tahun lalu. Ia menempuh gelap yang tak berujung, melewati langit yang tak pernah dipetakan, lalu tiba tepat ketika kamu menengadah. Dan ia tidak pernah minta maaf karena terlambat.

Kita lucu, ya. Ojek daring telat tiga menit saja, kita kasih bintang satu. Sementara bintang yang telat empat ratus tahun, kita foto, kita unggah, lalu kita beri tanda hati.

Barangkali begitulah semua hal baik bekerja. Kabar yang melegakan, orang yang tepat, versi dirimu yang lebih lapang, semuanya sedang dalam perjalanan. Mereka tidak lupa jalan. Jaraknya saja yang memang jauh dan sunyi, dan tak bisa dipercepat dengan cemas.

Maka bila malam ini dunia seperti sudah sampai di mana-mana sementara kamu belum ke mana-mana, ingatlah bahwa yang paling terang sering kali justru yang menempuh perjalanan paling lama.

“Kalau cahaya yang terlambat empat ratus tahun saja boleh tetap indah, apa yang membuatmu merasa harus selesai hari ini?”`,
            final: "Kamu tidak terlambat. Kamu sedang dalam perjalanan. Dari kejauhan, dua hal itu memang sering terlihat sama."
        },
        "02": {
            small: "Titik kecil ini ketemu juga. Ternyata bakat detektifmu ada, cuma selama ini dipakai buat nyari charger.",
            title: "Berhenti sebentar bukan berarti tertinggal.",
            poem:
`Kita dibesarkan dengan keyakinan yang aneh bahwa berhenti itu dosa. Yang diam dianggap kalah, yang menepi dianggap menyerah, dan yang bertanya, “sebenarnya aku ini mau ke mana?” dianggap kurang bersyukur.

Maka kita sibuk. Sibuk adalah alibi paling sopan di dunia. “Maaf, lagi sibuk” terdengar jauh lebih terhormat daripada “maaf, aku sedang menghindari diriku sendiri.”

Sebab begitu berhenti, semua yang kita hindari datang menyusul. Lelah yang tertunda. Rindu yang dititipkan di laci. Pertanyaan-pertanyaan yang dibiarkan menggantung seperti jemuran yang lupa diangkat.

Padahal lihatlah lift di gedung mana pun. Ia berhenti di tiap lantai, membuka pintu, menunggu, lalu melanjutkan perjalanan, dan tak seorang pun pernah menyebutnya gagal. Ia justru dianggap bekerja dengan benar.

Berhenti bukan mundur. Berhenti adalah cara perjalanan memastikan bahwa kamu masih ikut di dalamnya.`,
            final: "Berhentilah sebentar. Yang tertinggal di belakang itu mungkin dirimu sendiri, dan dia sudah lama menunggu."
        },
        "03": {
            small: "Kamu pegang jantungnya jeda ini. Detaknya pelan, jangan dikagetin pakai notifikasi.",
            title: "Ada satu pekerja di dalam tubuhmu yang tidak pernah cuti.",
            poem:
`Sebelum kamu bisa jatuh cinta, sebelum bisa menyesal, sebelum bisa cemas tentang besok, ada satu pekerjaan yang sudah dikerjakan tubuhmu tanpa diminta, yaitu menarik napas. Dua puluh ribu kali sehari, kira-kira. Tidak pernah lembur, tidak pernah mogok, tidak pernah menagih upah.

Aneh, ya. Wi-Fi putus tiga detik saja kita mengomel panjang. Napas yang setia sejak hari pertama, paling banter kita sapa dengan “huh, lega” sehabis mengangkat galon.

Dan bagian yang paling mengharukan ada di sini. Di hari-hari ketika kamu kecewa pada dirimu sendiri, ketika merasa tak berguna, ketika enggan bertemu cermin, tubuhmu tetap memilih bertahan. Tarik napas. Hembuskan. Lagi. Seolah ia berbisik, “aku belum menyerah padamu, jadi kamu juga jangan dulu.”

Barangkali itu sebabnya orang bijak selalu memulai dari napas. Sebelum belajar apa pun, kita perlu diingatkan bahwa ada sesuatu di dalam diri yang tetap setia, bahkan ketika kita sendiri lupa.

Coba sekali saja, pelan. Tarik. Tahan sebentar. Lepaskan. Nah, begitu. Tubuhmu pasti senang mendengar kamu akhirnya menyapa.`,
            final: "Hari ini, ucapkan satu terima kasih pada tubuhmu. Ia sudah menunggu sejak hari pertama."
        },
        "04": {
            small: "Nah, ini kopinya. Hitam, pahit, dan harganya tahu diri di tanggal tua.",
            title: "Kita jadi suka kopi pahit, dan alasannya tidak sesederhana selera.",
            poem:
`Waktu kecil, kopi itu minuman paling jahat sedunia. Satu seruput, wajah langsung seperti orang baru dapat surat tilang. Sekarang kita duduk di warung kopi pinggir jalan, bilang, “kopi hitam, Pak, nggak usah pakai gula,” lalu menambahkan, “enak kok, pahitnya pas,” sambil sok tenang.

Alasan pertamanya sebetulnya soal gengsi. Di suatu titik kita sadar bahwa kopi manis terasa seperti minuman anak-anak, sedangkan kopi pahit seperti kartu anggota dunia orang dewasa. Maka kita memesannya sambil mengangguk-angguk, seolah paham kenapa bapak-bapak dulu bisa menikmatinya. Padahal dalam hati, dua sendok gula itu masih terdengar sangat menggoda. Tapi mungkin ada alasan kedua. Mungkin kita tidak benar-benar jadi suka pahit, kita hanya sudah terlalu sering menelannya, mulai dari omongan yang disimpan sendiri, janji yang tak ditepati, sampai hari-hari ketika kita bilang “nggak apa-apa” padahal apa-apa banget. Lidah kita kebal lebih dulu. Kopi tinggal pelengkap.

Tapi pahit itu bukan cacat. Tanpa pahit, kopi hanya air cokelat yang kebanyakan gaya. Hidup pun begitu. Kita ingin versi tanpa pahit, lalu menangisi hidup yang tak jadi, sampai lupa bahwa gelas di tangan kita sekarang masih hangat.

Menerima bukan berarti suka pada semua rasa. Menerima hanya berarti berhenti memarahi gelasnya, lalu meminumnya selagi hangat. (Kalimat itu bagus banget buat caption. Jadi jangan diambil ya, hehe.)

Dan kopi punya kelebihan yang tak dimiliki obat apa pun, yaitu ia memaksa kita duduk. Panas, jadi harus pelan. Pelan, jadi harus diam. Itu sebabnya bapak-bapak di warung betah berjam-jam dengan segelas yang sama. Mereka sebenarnya bukan sedang minum kopi, mereka sedang menyewa jeda, tarifnya lima ribu rupiah, sudah termasuk analisis bola dan politik secara cuma-cuma.`,
            final: "Kalau hari ini pahitnya kebanyakan, tidak apa-apa memesan yang manis, bahkan yang di kafe dengan harga yang bikin dompet menjerit. Dana darurat memang dibuat untuk hari seperti ini, dan tidak ada yang akan mencabut gelar dewasamu."
        },
        "05": {
            small: "Titik kecil yang tadinya disangka debu. Ternyata punya cerita, dan lumayan panjang.",
            title: "Kebahagiaan sering datang dalam ukuran receh.",
            poem:
`Kita suka membayangkan kebahagiaan itu besar. Wisuda, gaji pertama, liburan ke tempat yang fotonya sudah lama disimpan di galeri. Lalu kita menunggu, dan selama menunggu, hari-hari biasa kita anggap cuma selingan.

Padahal yang sering menyelamatkan hari justru yang receh. Sinyal penuh di tempat yang biasanya blank. Hujan yang baru turun setelah jemuran diangkat. Lagu yang kamu butuhkan tiba-tiba terputar di warung entah milik siapa. Dan ibu warteg yang menambah nasi tanpa ditanya, sambil bilang, “eh, kebanyakan ambil nih,” padahal kamu tahu itu bukan salah ambil. Itu cinta yang menyamar jadi kelalaian. Belum lagi total bayar yang anehnya selalu dibulatkan ke bawah. Ehehe, sepele banget, tapi kok bisa bikin dada lega.

Coba ingat juga bekal yang diselipkan ibu tanpa kamu minta, lengkap dengan sambal yang dibungkus plastik berlapis tiga (jangan sekali-kali mencoba memindahkannya). Atau selimut yang tahu-tahu menutupi bahumu saat kamu ketiduran di sofa, dan tak seorang pun mengaku sebagai pelakunya.

Kelak kamu mungkin lupa isi pidato wisudamu. Tapi kamu tidak akan lupa rasa sambal itu. Sebab hidup tidak hanya dikenang lewat hari-hari besar. Hidup juga dikenang lewat rasa hangat kecil yang tak sempat diberi nama.

Jadi hari ini, coba perhatikan satu hal receh saja, lalu bilang “terima kasih” dalam hati. Ia tidak akan menjawab, tapi ia pasti mengerti.`,
            final: "Cari satu hal receh hari ini dan sebut namanya pelan-pelan. Itu cara paling sederhana untuk berdoa."
        },
        "06": {
            small: "Katanya ruang kosong. Tapi kalau dipandangi lama-lama, ada saja yang muncul.",
            title: "Kosong itu bukan berarti rusak.",
            poem:
`Kita ini takut sekali pada yang kosong. Lemari harus penuh, sudut kamar harus berisi, dan selalu ada kardus bertuliskan “siapa tahu nanti kepakai” yang sudah pindah tiga kos tanpa pernah dibuka. Penyimpanan HP penuh pun, kita tetap mengunduh aplikasi baru.

Hati kita ternyata sama. Begitu ada waktu lengang di jadwal, buru-buru kita isi. Menggulir layar, mengerjakan apa saja, berkumpul dengan siapa saja yang bisa. Asal jangan sendirian dengan kosongnya, karena kosong terasa seperti ada yang hilang.

Padahal kosong itu bukan tanda ada yang rusak. Lagu butuh jeda di antara nada, kalau tidak, itu bukan musik, itu kebisingan. Rumah tidak bisa dibangun di tanah yang sudah penuh. Dan piring yang kosong itu tandanya kita sudah kenyang, bukan tandanya kita rugi.

Mungkin ruang kosong di dadamu bukan lubang yang harus ditambal. Mungkin itu kamar yang sedang disiapkan untuk sesuatu yang belum kamu kenal. Biarkan ia lengang dulu. Yang pantas biasanya datang kalau pintunya tidak sedang dijejali.`,
            final: "Kosongkan sepuluh menit. Tidak usah diisi apa-apa. Lihat siapa yang datang bertamu."
        },
        "07": {
            small: "Sabit kecil yang malu-malu. Tipis, tapi jejaknya di langit tetap kelihatan.",
            title: "Kata-katamu mungkin sedang disimpan seseorang.",
            poem:
`Coba ingat guru yang pernah bilang, “tulisanmu lumayan.” Satu kata saja, “lumayan”, diucapkan sambil lalu, mungkin sambil mencari spidol. Beliau sudah lupa. Kamu menyimpannya bertahun-tahun, dan sampai sekarang masih berani menulis.

Kalimat kecil itu seperti bulan sabit. Tipis, tidak sebesar purnama, tapi cukup menerangi jalan pulang bagi yang kebetulan menengadah.

Nah, ini bagian serunya. Kamu juga pernah jadi guru bagi orang lain tanpa sadar. Mungkin kamu pernah bilang “kamu pasti bisa” sambil mengunyah gorengan, dan seseorang memutuskan bertahan sampai pagi. Mungkin kamu pernah membukakan pintu untuk orang asing, dan ia merasa dunia masih mau menunggunya.

Kita bahkan lupa menu makan siang kemarin, tapi ada orang yang menyimpan kalimat kita sepuluh tahun, rapi seperti kamus. Hehe, ternyata kamu punya penggemar rahasia.

Jadi hati-hati dengan kata-katamu, tapi jangan takut. Cukup jadi baik. Selebihnya biar waktu yang mengurus.`,
            final: "Mungkin kamu pernah menyelamatkan seseorang tanpa pernah tahu. Itu rahasia terbaik semesta, dan kamu pantas bangga meski tak diberi tahu."
        },
        "08": {
            small: "Bagian ini direvisi empat kali. Tiga kali ditolak jempol, yang keempat akhirnya di-ACC.",
            title: "Bulan tidak pernah tahu dia seterang itu.",
            poem:
`Ini bukan tulisan penyair, cuma catatan mahasiswa yang menulis sambil menunda tugas dengan tenggat malam ini. Kalau kalimatnya mendadak puitis, tolong maklum. Itu efek kurang tidur dan kebanyakan kopi, bukan bakat.

Ada malam-malam yang berjalan seperti biasa. Langit pekat, bintang-bintang pura-pura sibuk, dan hidup terasa seperti kuliah jam tujuh pagi, wajib hadir tapi tak ada yang bersemangat. Lalu pelan-pelan, tanpa aba-aba, bulan terbit dari balik gelap, mengubah malam yang kelam jadi keperakan. Cahayanya tidak menyilaukan dan tidak berisik, hanya teduh dan secukupnya, seperti lampu kecil yang dinyalakan di ujung lorong supaya kita tidak takut melangkah.

Anehnya, bulan tidak pernah merasa sedang bersinar. Cahayanya saja pinjaman dari matahari, tanpa bunga, tanpa denda, dan tak seorang pun menagih. Kalau kita yang punya cahaya sebagus itu, sudah pasti diunggah dengan keterangan “lagi glowing”. Bulan tidak. Ia hanya lewat, menunaikan tugasnya, lalu pulang tanpa menunggu ucapan terima kasih. Padahal di bawahnya ada langkah-langkah yang mendadak ringan, yang tiba-tiba yakin bahwa pulang itu mungkin, hanya karena ada sesuatu yang menyala di atas sana, gratis dan tanpa langganan bulanan.

Rajin sekali, ya. Sorenya ia dipanggil senja, malamnya dipanggil bulan, nama boleh dua tapi keindahannya tetap satu. Tak pernah bolos, tak pernah minta ganti jadwal, jauh berbeda dengan dosen yang membalas pesan saja butuh tiga hari dan dua doa. Langit sungguh beruntung punya pekerja seindah itu, sementara kita paling banter disapa notifikasi diskon ongkir.

Mungkin itu sebabnya cahaya yang paling menenangkan jarang datang dengan pengumuman. Ia hadir begitu saja, dan kita baru sadar ketika langkah sudah lebih ringan dari kemarin. Pelajaran pertamanya sederhana, menjadi terang tidak harus berisik, dan menjadi berarti tidak harus disadari.

Bulan tidak akan pernah tahu. Dan barangkali begitulah cara terbaiknya, sebab keindahan yang paling jujur biasanya tidak sadar sedang dipandangi. Lalu di tengah jalan yang tadinya cuma dihitung langkahnya itu, tahu-tahu kutemukan...`,
            final: "Titik-titiknya sengaja dibiarkan. Tebak sendiri. Tenang, tidak ada nilainya, apalagi remedial."
        },
        "09": {
            small: "Hati-hati mencet hati. Yang ini gampang gugup.",
            title: "Senja tidak dikejar, ia ditunggu.",
            poem:
`Banyak orang melihat senja lalu refleks mengangkat HP. Hasilnya selalu sama, lebih jelek dari aslinya, padahal kameranya katanya seratus delapan megapiksel. Dikirim ke grup keluarga pun, balasannya cuma “bagus, sudah makan?” Lama-lama kita paham bahwa ada hal yang memang tidak dibuat muat di layar, dan tidak dibuat untuk dikoleksi.

Senja hanya datang, membiarkan jingganya luruh pelan di tepi cakrawala, mengecat langit dengan warna yang tak punya nama di kotak pensil mana pun, lalu pamit tanpa menagih apa-apa. Tak ada yang pernah berhasil mengejarnya. Yang mencoba hanya kehabisan napas, bahkan kehabisan bensin, sementara yang duduk tenang di tempat yang sama justru kebagian cahayanya, sore demi sore. Mungkin itu pelajaran paling lembut dari langit sore, bahwa tidak semua yang indah harus digenggam.

Anehnya, senja sore ini terasa mirip sekali dengan bulan semalam. Pantas saja, ternyata keduanya keindahan yang sama, cuma beda jam tayang.

Dan keindahan seperti itu membuat langkah ingin melambat. Ada sesuatu yang tumbuh pelan, sunyi tapi pasti, seperti lembayung yang merambat di ujung langit, tidak gaduh dan tidak minta diumumkan, hanya hangat yang menetap. Sempat kubuka Google Maps untuk mencari arahnya. Layarnya hanya menampilkan lingkaran kecil yang berputar dan tulisan “sedang mencari rute”. Sampai sekarang belum selesai. Mungkin sinyal kampus, mungkin kuota sudah tanggal tua, atau mungkin perjalanannya memang belum waktunya.

Maka senja pantas ditunggu dengan cara yang benar, tidak tergesa dan tidak memaksa langit cepat-cepat berganti warna. Cukup duduk di tempat yang biasa, lalu menjaganya lewat satu-satunya cara yang gratis dan legal, yaitu doa. Semoga langitnya selalu teduh, semoga jalannya dimudahkan, dan semoga kelak, kalau memang sudah waktunya, sore itu datang dengan sendirinya.

Terima kasih, Senja, sudah sempat mampir dan mengecat hari-hari yang tadinya biasa saja. (Beruntung sekali kamu, didoakan tiap hari dan tidak pernah ditagih uang parkir.)`,
            final: "Semoga senja itu dijaga di mana pun langitnya berada. Lewat doa, tanpa syarat, tanpa jatuh tempo."
        },
        "10": {
            small: "Ketemu lagi. Kamu detektif yang belum digaji, tapi telaten juga.",
            title: "Ada kalimat yang tersangkut di antara senja dan bulan.",
            poem:
`Kalimatnya pendek. Tidak sampai sepuluh kata. Tapi tiap kali jari sampai di huruf pertama, keberanian mendadak masuk angin dan minta dikerokin.

Rencana awalnya sederhana, ketik, kirim, hidup tenang. Kenyataannya ketik, hapus, ketik, hapus, lalu HP dimasukkan ke kulkas supaya tidak tergoda. Kulkasnya sampai bingung, kenapa ada HP di samping telur. Draf kalimat itu sekarang lebih banyak dari revisi makalah, dan satu pun belum dikirim. Maka ia disimpan dulu di laci yang kuncinya sengaja dihilangkan sendiri. Kenapa begitu, jangan tanya, penulisnya pun bingung, apalagi lacinya.

Laci itu bukan tempat membuang, tapi tempat menunggu. Ada kalimat yang belum diucapkan bukan karena tidak ada, melainkan karena penulisnya ingin pantas lebih dulu. Ingin menyelesaikan yang belum selesai, mengejar yang masih jauh di depan, lalu datang dengan tangan yang tidak kosong. Sebab ada hal yang lebih baik datang terlambat tapi utuh, daripada tepat waktu tapi setengah matang. Keberanian ternyata bukan soal cepat, tapi soal siap.

Yang boleh diceritakan baru sedikit. Ada keteduhan yang tidak dibuat-buat, sederhana seperti sabit yang tipis, tapi sanggup membuat malam seburuk apa pun terasa ramah. Ia datang ringan, seperti angin sore yang lewat tanpa permisi, dan cukup untuk membuat hari yang tadinya biasa saja jadi susah dilupakan. Kalau bisa dijadikan nada dering, akan kupasang seumur hidup dan tidak kuganti walau HP sudah ganti tiga kali, bahkan walau HP-nya pernah menginap di kulkas.

Hari-hari ini mirip gerimis pertama yang masih tertahan di ujung awan. Wangi tanahnya sudah tercium, tinggal menunggu langit mengambil keputusan. Sambil menunggu, nasib kalimatnya mirip tugas besar, sudah dikerjakan sungguh-sungguh, belum berani dikumpulkan, dan penilai terbaiknya adalah waktu. (Semoga waktu bukan dosen killer. Atau mungkin justru iya.)

Kalau kamu mengerutkan dahi dan bertanya, “ini maksudnya apa sih?”, bagus. Tulisan ini memang sengaja belum selesai, seperti proposal yang masih menunggu ACC dari waktu.

Tiap malam ada pertanyaan yang dilempar ke langit-langit kamar, “kalau nanti sudah cukup berani, apakah senja itu masih mau menunggu sampai kalimatnya selesai?” Langit-langit diam saja. Pendengar yang profesional, tidak menyela, tidak membocorkan ke grup.`,
            final: "Bersambung. Ini memang menyebalkan. Anggap saja latihan sabar, gratis, tanpa sertifikat."
        },
        "11": {
            small: "Kamu sampai di ujung. Jarang ada yang sesabar ini, apalagi untuk membaca tulisan orang yang jam tidurnya berantakan.",
            title: "Kamu tidak harus menang dulu untuk pantas dirayakan.",
            poem:
`Sebelas pintu kecil sudah kamu buka. Sebelas! Kebanyakan orang menyerah di pintu keempat, apalagi kalau kebetulan sedang lapar dan tanggal tua. Kalau kamu sampai di sini, itu bukan lagi kesabaran, itu mental pejuang kuota.

Maka sebelum apa pun, izinkan tulisan terakhir ini mengucapkan satu kata. Selamat. Bukan karena kamu menang lomba, bukan karena IPK-mu naik, bukan karena ada yang menyebut namamu lewat pengeras suara. Tidak ada MC dan tidak ada kue, tapi ucapannya tulus dan gratis. Selamat karena kamu masih berjalan, dan masih mau membuka pintu kecil yang tidak menjanjikan hadiah apa-apa.

Sepanjang jalan tadi, sebenarnya tidak ada yang sedang menggurui. Semesta saja yang diam-diam menyelipkan pelajaran di hal-hal kecil. Tanpa papan pengumuman, tanpa absen, seperti dosen paling santai sedunia. Dan kita, mahasiswanya, sering bolos tanpa sadar, sebab kelasnya ada di lift, di warung kopi, dan di setiap napas yang kita tarik tanpa dipikir.

Cahaya bintang itu telat empat ratus tahun, tapi tetap indah. Mungkin semesta sedang bilang, terlambat bukan berarti gagal, hanya belum sampai. Lift berhenti di setiap lantai, dan tetap sampai juga. Berhenti sebentar ternyata tidak sama dengan tertinggal. Napas kita tak pernah cuti, tak pernah minta upah, tak pernah mengeluh. Setia itu kadang diam-diam, dan jarang kita beri terima kasih.

Kopi pahit di warung pinggir jalan mengajari kita menerima, dan memesan yang manis sesekali pun bukan dosa, meski dompet menjerit. Nasi tambahan dan sambal bungkus tiga lapis mengajari bahwa bahagia memang sering berukuran receh. Ruang kosong mengajari bahwa lengang bukan berarti rusak. Dan kata-kata kecil yang diam-diam disimpan orang mengajari bahwa kebaikan kita mungkin sedang berjalan jauh tanpa kita tahu.

Lalu ada bulan yang tak pernah sadar dirinya terang, senja yang tak bisa digenggam, dan sebuah kalimat yang masih tersangkut di laci. Dari mereka kita belajar bahwa yang terang tidak harus berisik, yang indah tidak harus digenggam, dan berani tidak harus buru-buru.

Jujur saja, aku bukan murid teladan di kelas itu. Duduk di barisan belakang, sering telat, kadang cuma menyalin catatan teman. Tapi akhir-akhir ini mulai belajar menyimak, pelan-pelan, dan ternyata lebih seru kalau ramai-ramai. Anggap saja tempat kecil ini buku catatan kita bersama, murid-murid bangku belakang yang belum tentu paham, tapi sama-sama mau mencoba.

Kalau semua pelajaran kecil itu dikumpulkan, sepertinya semesta cuma sedang bilang satu hal. Bintang tidak menunggu sampai tiba untuk disebut indah. Lift tidak menunggu sampai lantai teratas untuk dianggap bekerja dengan benar. Jadi mungkin kita pun tidak harus menang dulu untuk pantas dirayakan. Tidak perlu menunggu IPK tinggi, tidak perlu menunggu lulus tepat waktu, tidak perlu dapat pekerjaan mapan dulu, tidak perlu menunggu jadi yang paling kuat di ruangan.

Manusia memang gemar merayakan garis finis, dan lupa pada yang sedang berlari dengan napas tersengal dan tali sepatu terlepas. Padahal yang masih bertahan di tengah jalan, sambil menelan pahit dengan gaya, sama pantasnya mendapat tepuk tangan.

Penulisnya sendiri jarang kebagian tepuk tangan. Ulang tahun lewat seperti tanggal merah biasa. Pencapaian kecil lewat sambil lalu. Lulus mata kuliah yang paling ditakuti pun, alhamdulillah, dirayakan sendiri dengan seporsi mi ayam. Lama-lama jadi fasih berkata “nggak usah repot-repot”, padahal dalam hati berbisik, “tolonglah, repot-repot sedikit.” Bercanda. Setengahnya.

Makanya tempat kecil ini ada. Bukan untuk dipamerkan. Hanya supaya di antara iklan, debat kusir, dan notifikasi yang menagih balasan, ada satu sudut internet yang berkata kepada siapa pun yang tersesat, “kamu layak dirayakan.” Gratis, tanpa syarat dan ketentuan berlaku. Cukup karena kamu masih di sini, masih berusaha, dengan cara yang kadang berantakan.

Dan untuk semua cahaya yang pernah menemani jalan, entah itu bulan, senja, atau lampu kecil di ujung lorong, terima kasih. Kalian tidak pernah tahu seterang apa, dan memang tidak perlu tahu. Semoga langit selalu teduh di atas kalian. Semoga kelak, kalau sudah waktunya, kalimat-kalimat yang masih di laci menemukan jalan keluarnya. Asal kuncinya ketemu dulu, dan semoga bukan di kulkas, di samping HP dan telur.

Ada dua pertanyaan yang jarang diajukan orang, dan ikut terselip di jalan tadi. Tidak perlu dijawab, kita simpan masing-masing saja.

“Kapan terakhir kali kamu bangga pada dirimu sendiri, tanpa menunggu ada yang bertepuk tangan?”

“Kalau malam ini kamu boleh meminta satu kalimat dari siapa saja, kalimat apa yang paling kamu tunggu, tapi belum pernah berani kamu minta?”

Pertanyaan memang boleh disimpan dulu. Jawabannya biasanya datang sendiri kalau sudah waktunya.

Sebentar lagi tempat kecil ini pamit. Ia tidak ke mana-mana, hanya berhenti di sini, seperti lift yang akhirnya sampai di lantai tujuan. Pintunya terbuka, dan kita melangkah keluar dengan bahu yang sedikit lebih ringan. Selamat tinggal, tapi pintunya tidak ditutup rapat. Kuncinya kan masih hilang.

Soal “jangan diambil jadi caption” tadi, itu bercanda. Setengahnya. Ambil saja kalimat mana pun yang kamu suka, asal artinya ikut kamu bawa pulang.

Di balik pintu ini ada panggung kecil. Naiklah. Kalau tak ada yang menyalakan lampunya untukmu, hari ini biar aku yang jadi tukang lampunya.

Kalau dadamu terasa hangat sekarang, biarkan saja. Itu tanda hatimu masih bekerja dengan baik. Kalau matamu panas, silakan. Tidak lihat, kok. Aku cuma tulisan.`,
            final: "W.Adidjabar, laki-laki yang masih belajar berani, satu jeda demi satu jeda."
        }
    };

    const style = document.createElement("style");
    style.textContent = `
#eggCard{isolation:isolate;overflow:hidden !important;display:flex;flex-direction:column;padding:0 !important;
  width:min(640px,100%);max-height:min(700px,calc(100vh - 40px));max-height:min(700px,calc(100dvh - 40px));
  box-shadow:0 40px 120px rgba(0,0,0,.45),0 0 70px rgba(255,226,170,.07)}
#eggCard .egg-close{z-index:5}
.egx-scroll{position:relative;flex:1;min-height:0;overflow-y:auto;overscroll-behavior:contain;
  -webkit-overflow-scrolling:touch;padding:clamp(34px,5vw,50px) clamp(20px,5vw,48px) clamp(24px,4vw,36px);
  -webkit-mask-image:linear-gradient(to bottom,transparent 0,#000 16px,#000 calc(100% - 22px),transparent 100%);
  mask-image:linear-gradient(to bottom,transparent 0,#000 16px,#000 calc(100% - 22px),transparent 100%);
  scrollbar-width:thin;scrollbar-color:rgba(255,226,170,.25) transparent}
.egx-scroll::-webkit-scrollbar{width:4px}
.egx-scroll::-webkit-scrollbar-thumb{background:rgba(255,226,170,.25);border-radius:4px}
#eggCard .egg-footer{margin:14px 0 18px}
#eggCard .egx-p{display:block;margin-top:.8em}
#eggCard .egx-p:first-child{margin-top:0}
#eggCard h2{line-height:1.25}
.egx-count{margin:0 0 6px;font-size:11px;letter-spacing:.22em;text-transform:uppercase;opacity:.55}

/* Mode compact khusus popup ke-11 */
#eggCard.is-final .egg-small{font-size:10px;margin-bottom:12px;letter-spacing:.1em}
#eggCard.is-final h2{font-size:clamp(21px,3.4vw,28px);max-width:460px;line-height:1.3}
#eggCard.is-final .egg-poem{font-size:clamp(13px,1.7vw,15.5px);line-height:1.62;margin:16px auto 0;max-width:470px}
#eggCard.is-final .egx-p{margin-top:.65em}
#eggCard.is-final .egg-final{font-size:14px;line-height:1.6;margin:18px auto 0;max-width:440px}
#eggCard.is-final .egg-footer{margin:10px 0 14px}
@media (max-width:480px){#eggCard.is-final .egg-poem{font-size:13px}#eggCard.is-final h2{font-size:21px}}

/* Langit menempel di bingkai (tidak ikut ter-scroll) */
.egx-sky{position:absolute;inset:0;z-index:-1;overflow:hidden;pointer-events:none;border-radius:inherit}
.egx-s{position:absolute;line-height:1;font-size:var(--s,12px);color:var(--c,#ffe2aa);
  text-shadow:0 0 8px currentColor;opacity:.15;translate:0 calc(var(--sy,0px) * var(--p,-.2));
  animation:egxTwinkle var(--t,3s) ease-in-out var(--d,0s) infinite}
.egx-moon{opacity:.6;color:#ffe9b8;text-shadow:0 0 16px rgba(255,226,170,.7);
  animation:egxSway 5.5s ease-in-out var(--d,0s) infinite}
.egx-shoot{position:absolute;left:-10%;top:var(--y,12%);width:64px;height:1px;opacity:0;
  background:linear-gradient(90deg,transparent,#fff);
  animation:egxShoot 9s ease-in var(--d,2s) infinite}

/* Efek kecil di luar bingkai */
.egx-out{position:absolute;inset:0;z-index:0;overflow:hidden;pointer-events:none}
.egx-o{position:absolute;bottom:-28px;line-height:1;font-size:var(--s,11px);color:var(--c,#ffe2aa);
  text-shadow:0 0 8px currentColor;opacity:0;animation:egxRise var(--t,9s) linear var(--d,0s) infinite}
.egx-o.is-big{text-shadow:0 0 14px currentColor,0 0 28px currentColor}

/* Toast + getar untuk popup yang masih terkunci */
.egx-toast{position:fixed;left:50%;bottom:26px;z-index:2147483000;max-width:min(88vw,380px);padding:11px 18px;
  border:1px solid rgba(255,226,170,.28);border-radius:999px;background:rgba(14,13,12,.94);color:#f2f0eb;
  font-size:13px;line-height:1.5;text-align:center;opacity:0;pointer-events:none;
  transform:translate(-50%,12px);transition:opacity .4s ease,transform .5s ease}
.egx-toast.is-on{opacity:1;transform:translate(-50%,0)}
.egx-shake{animation:egxShake .5s ease both !important}

@keyframes egxTwinkle{0%,100%{opacity:.12;transform:scale(.75)}50%{opacity:.95;transform:scale(1.25)}}
@keyframes egxSway{0%,100%{transform:rotate(-9deg) translateY(0)}50%{transform:rotate(9deg) translateY(-7px)}}
@keyframes egxShoot{0%{opacity:0;transform:translate(0,0) rotate(18deg)}4%{opacity:1}
  14%,100%{opacity:0;transform:translate(420px,136px) rotate(18deg)}}
@keyframes egxRise{0%{opacity:0;transform:translate(0,0) scale(.8)}
  12%{opacity:var(--o,.75)}
  25%{transform:translate(calc(var(--sx,10px) * -.5),-28vh) scale(.95)}
  50%{transform:translate(var(--sx,10px),-56vh) scale(1.08)}
  75%{transform:translate(calc(var(--sx,10px) * .6),-84vh) scale(.98)}
  88%{opacity:calc(var(--o,.75) * .7)}
  100%{opacity:0;transform:translate(calc(var(--sx,10px) * -.8),-114vh) scale(.85)}}
@keyframes egxShake{0%,100%{transform:translateX(0)}20%{transform:translateX(-5px)}40%{transform:translateX(5px)}
  60%{transform:translateX(-3px)}80%{transform:translateX(3px)}}
@media (prefers-reduced-motion:reduce){.egx-s,.egx-moon,.egx-shoot,.egx-shake{animation:none !important}
  .egx-s{opacity:.5}.egx-shoot,.egx-out{display:none}.egx-toast{transition:none}}
`;
    document.head.appendChild(style);

    /* Bungkus isi kartu dalam area scroll sendiri (tombol tutup tetap di luar) */
    const scroller = document.createElement("div");
    scroller.className = "egx-scroll";
    Array.from(card.children).forEach((el) => {
        if (el !== closeButton) scroller.appendChild(el);
    });
    card.appendChild(scroller);

    const sky = document.createElement("div");
    sky.className = "egx-sky";
    sky.setAttribute("aria-hidden", "true");
    card.prepend(sky);

    const out = document.createElement("div");
    out.className = "egx-out";
    out.setAttribute("aria-hidden", "true");
    backdrop.after(out);

    scroller.addEventListener("scroll", () => {
        sky.style.setProperty("--sy", scroller.scrollTop + "px");
    }, { passive: true });

    /* Bintang hanya di lorong tepi supaya tidak menimpa tulisan */
    const SPOTS = [
        [4, 6, "✦", 13], [94, 9, "✧", 11], [7, 22, "·", 16], [93, 27, "✦", 10],
        [3, 40, "✧", 12], [96, 46, "·", 15], [6, 58, "✦", 11], [94, 63, "✧", 13],
        [4, 76, "·", 16], [95, 80, "✦", 12], [8, 92, "✧", 11], [90, 94, "✦", 13],
        [50, 2, "·", 14], [48, 98, "✧", 10], [10, 12, "·", 12], [91, 88, "·", 13]
    ];
    const COLORS = ["#ffe2aa", "#ffd0dc", "#d4c6ff", "#bfeaff", "#ffffff"];
    const rand = (a, b) => a + Math.random() * (b - a);

    const buildSky = () => {
        sky.innerHTML = "";
        const add = (cls, txt, x, y, size) => {
            const el = document.createElement("span");
            el.className = cls;
            el.textContent = txt;
            el.style.left = x + "%";
            el.style.top = y + "%";
            el.style.setProperty("--s", size + "px");
            el.style.setProperty("--c", COLORS[Math.floor(rand(0, COLORS.length))]);
            el.style.setProperty("--t", rand(2.2, 4.4).toFixed(1) + "s");
            el.style.setProperty("--d", rand(0, 3).toFixed(1) + "s");
            el.style.setProperty("--p", (-rand(0.08, 0.35)).toFixed(2));
            sky.appendChild(el);
        };
        SPOTS.forEach(([x, y, t, s]) => add("egx-s", t, x + rand(-1.5, 1.5), y + rand(-2, 2), s));
        add("egx-s egx-moon", "☾", 89, 4, 26);
        add("egx-s egx-moon", "☽", 5, 91, 20);
        [["9%", "1.5s"], ["55%", "5.5s"]].forEach(([y, d]) => {
            const s = document.createElement("span");
            s.className = "egx-shoot";
            s.style.setProperty("--y", y);
            s.style.setProperty("--d", d);
            sky.appendChild(s);
        });

        buildOut();
    };

    /* partikel di luar bingkai: jumlah ikut lebar layar, banyak di lorong kiri-kanan, layer di belakang kartu */
    let outW = 0;
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const buildOut = () => {
        out.innerHTML = "";
        const vw = document.documentElement.clientWidth || window.innerWidth;
        outW = vw;
        const cardW = Math.min(640, vw - (vw <= 700 ? 28 : 60));
        const gutterPct = ((vw - cardW) / 2) / vw * 100; /* lebar lorong kiri/kanan, dalam % */
        const total = clamp(Math.round(vw / 50), 16, 40);
        const hasGutter = gutterPct > 4;
        const G = ["✦", "✧", "·", "✦", "·", "✧"];

        for (let i = 0; i < total; i++) {
            const el = document.createElement("span");
            const big = i % 9 === 4;
            el.className = "egx-o" + (big ? " is-big" : "");
            el.textContent = big ? "✦" : G[i % G.length];

            let x;
            if (hasGutter && i % 7 !== 6) {
                /* selang-seling kiri / kanan, di dalam lorong */
                x = i % 2 === 0
                    ? rand(1.2, Math.max(2, gutterPct - 1.5))
                    : rand(Math.min(98, 100 - gutterPct + 1.5), 98.8);
            } else {
                x = rand(2, 97);
            }
            el.style.left = x.toFixed(1) + "%";
            el.style.setProperty("--s", (big ? rand(17, 24) : rand(8, 16)).toFixed(0) + "px");
            el.style.setProperty("--c", COLORS[i % COLORS.length]);
            el.style.setProperty("--t", (big ? rand(14, 20) : rand(9, 16)).toFixed(1) + "s");
            el.style.setProperty("--d", (-rand(0, 16)).toFixed(1) + "s");
            el.style.setProperty("--sx", (rand(-28, 28)).toFixed(0) + "px");
            el.style.setProperty("--o", (big ? rand(0.5, 0.75) : rand(0.5, 0.9)).toFixed(2));
            out.appendChild(el);
        }
    };

    /* layar diubah ukurannya saat popup terbuka: susun ulang lorongnya */
    let outResizeTimer = 0;
    window.addEventListener("resize", () => {
        clearTimeout(outResizeTimer);
        outResizeTimer = setTimeout(() => {
            const w = document.documentElement.clientWidth || window.innerWidth;
            if (overlay.classList.contains("is-open") && Math.abs(w - outW) > 40) buildOut();
        }, 200);
    });

    const counter = document.createElement("p");
    counter.className = "egx-count";
    smallText.before(counter);

    /* Tombol "buka pesannya" dipindah ke atas, tepat di bawah judul */
    const footer = card.querySelector(".egg-footer");
    if (footer) titleText.after(footer);

    /* Toast untuk popup yang masih terkunci */
    const toast = document.createElement("div");
    toast.className = "egx-toast";
    toast.setAttribute("role", "status");
    document.body.appendChild(toast);
    let toastTimer = 0;
    const showToast = (msg) => {
        toast.textContent = msg;
        toast.classList.add("is-on");
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => toast.classList.remove("is-on"), 2800);
    };

    const nameEl = document.querySelector(".credits strong");
    if (nameEl && !nameEl.dataset.eggId) {
        nameEl.dataset.eggId = LAST_ID;
        nameEl.classList.add("egg-trigger", "egg-name");
        nameEl.setAttribute("role", "button");
        nameEl.setAttribute("tabindex", "0");
        nameEl.setAttribute("aria-label", "Satu hal terakhir di balik sebuah nama");
    }

    const found = new Set();
    let isOpen = false;
    let isRevealed = false;
    let lastTrigger = null;
    let currentEggId = null;
    let prevOverflow = "";
    let prevPadRight = "";

    /* Pulihkan progres (tahan refresh selama tab yang sama) */
    try {
        JSON.parse(sessionStorage.getItem(STORE_KEY) || "[]").forEach((id) => {
            if (discoveries[id]) found.add(id);
        });
    } catch (e) { /* abaikan */ }
    found.forEach((id) => {
        document.querySelectorAll('[data-egg-id="' + id + '"]').forEach((el) => el.classList.add("is-found"));
    });
    const saveFound = () => {
        try { sessionStorage.setItem(STORE_KEY, JSON.stringify(Array.from(found))); } catch (e) { /* abaikan */ }
    };
    const foundBeforeLast = () => Array.from(found).filter((id) => id !== LAST_ID).length;

    const lockScroll = () => {
        prevOverflow = document.body.style.overflow;
        prevPadRight = document.body.style.paddingRight;
        const bar = window.innerWidth - document.documentElement.clientWidth;
        document.body.style.overflow = "hidden";
        if (bar > 0) document.body.style.paddingRight = bar + "px";
    };
    const unlockScroll = () => {
        document.body.style.overflow = prevOverflow;
        document.body.style.paddingRight = prevPadRight;
    };

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");

    /* Percikan kecil saat pesan dibuka (memakai canvas-confetti jika ada) */
    const burst = (count) => {
        if (reduced.matches || typeof window.confetti !== "function") return;
        window.confetti({
            particleCount: count,
            spread: 70,
            origin: { x: 0.5, y: 0.55 },
            colors: COLORS,
            scalar: 0.8
        });
    };

    const setContent = (d) => {
        smallText.textContent = d.small;
        titleText.textContent = d.title;
        poemText.textContent = "";
        d.poem.split(/\n\s*\n/).forEach((para) => {
            const p = document.createElement("span");
            p.className = "egx-p";
            p.textContent = para;
            poemText.appendChild(p);
        });
        finalText.textContent = d.final;
        counter.textContent = "penemuan " + found.size + " dari " + TOTAL_EGGS;
    };

    const resetReveal = () => {
        isRevealed = false;
        card.classList.remove("is-revealed");
        poemText.setAttribute("aria-hidden", "true");
        finalText.setAttribute("aria-hidden", "true");
        poemText.style.opacity = "0";
        poemText.style.transform = "translateY(10px)";
        finalText.style.opacity = "0";
        finalText.style.transform = "translateY(10px)";
        nextButton.textContent = "buka pesannya \u2192";
        scroller.scrollTop = 0;
        sky.style.setProperty("--sy", "0px");
    };

    const revealMessage = () => {
        if (isRevealed) { closeEgg(); return; }
        isRevealed = true;
        card.classList.add("is-revealed");
        poemText.setAttribute("aria-hidden", "false");
        finalText.setAttribute("aria-hidden", "false");
        poemText.style.opacity = "1";
        poemText.style.transform = "translateY(0)";
        setTimeout(() => {
            finalText.style.opacity = "1";
            finalText.style.transform = "translateY(0)";
        }, 160);
        nextButton.textContent = "tutup pelan-pelan \u00D7";
        burst(24);
        setTimeout(() => {
            poemText.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }, 260);
    };

    const tip = document.createElement("div");
    tip.className = "egg-tip";
    tip.setAttribute("role", "tooltip");
    tip.setAttribute("aria-hidden", "true");
    document.body.appendChild(tip);

    let tipTarget = null;
    let tipRaf = 0;

    function hideTip() {
        tipTarget = null;
        tip.classList.remove("is-on");
    }

    function placeTip() {
        tipRaf = 0;
        if (!tipTarget || !tipTarget.isConnected) { hideTip(); return; }
        const r = tipTarget.getBoundingClientRect();
        const vw = document.documentElement.clientWidth;
        const vh = window.innerHeight;
        if (r.bottom < 0 || r.top > vh || r.right < 0 || r.left > vw) { hideTip(); return; }

        const margin = 12;
        const gap = tipTarget.classList.contains("ambient-star") ? 30 : 20;
        const w = tip.offsetWidth;
        const h = tip.offsetHeight;
        const cx = r.left + r.width / 2;

        const left = Math.max(margin, Math.min(cx - w / 2, vw - w - margin));
        let top = r.top - h - gap;
        const below = top < margin;
        if (below) top = r.bottom + gap;

        tip.classList.toggle("is-below", below);
        tip.style.setProperty("--ax", Math.round(Math.max(14, Math.min(w - 14, cx - left))) + "px");
        tip.style.transform = "translate(" + Math.round(left) + "px," + Math.round(top) + "px)";
    }

    function showTip(el) {
        tipTarget = el;
        tip.textContent = el.dataset.hint || "";
        tip.classList.add("is-on");
        placeTip();
    }

    const tipHost = (node) => {
        const el = node && node.closest ? node.closest("[data-egg-id][data-hint]") : null;
        if (!el || el.classList.contains("hidden-trigger") || overlay.contains(el)) return null;
        return el;
    };

    document.addEventListener("pointerover", (event) => {
        if (event.pointerType === "touch" || isOpen) return;
        const el = tipHost(event.target);
        if (!el) { if (tipTarget) hideTip(); return; }
        if (el !== tipTarget) showTip(el);
    });

    document.addEventListener("pointerout", (event) => {
        if (!tipTarget) return;
        if (event.relatedTarget && tipTarget.contains(event.relatedTarget)) return;
        hideTip();
    });

    document.addEventListener("focusin", (event) => {
        const el = tipHost(event.target);
        if (el && el.matches(":focus-visible")) showTip(el);
    });
    document.addEventListener("focusout", hideTip);

    const queueTip = () => {
        if (tipTarget && !tipRaf) tipRaf = requestAnimationFrame(placeTip);
    };
    window.addEventListener("scroll", queueTip, { passive: true });
    window.addEventListener("resize", queueTip);

    const shyTargets = Array.from(document.querySelectorAll("[data-egg-id]"))
        .filter((el) => !overlay.contains(el));
    const SHY_RANGE = 110; /* px: jarak kursor mulai dianggap "mengancam" */
    const SHY_MAX = 15; /* px: jarak kabur maksimum */
    const POKE_MS = 240; /* lama egg meringkuk saat ditekan */
    const OPEN_DELAY = 190; /* jeda sebelum popup terbuka (biar kagetnya kelihatan) */
    const shyActive = new Set();
    const shyPoked = new Set();
    let shyPX = -9999;
    let shyPY = -9999;
    let shyRaf = 0;
    let openTimer = 0;

    const shySet = (el, x, y, r, s) => {
        el.style.setProperty("--shy-x", x.toFixed(1) + "px");
        el.style.setProperty("--shy-y", y.toFixed(1) + "px");
        el.style.setProperty("--shy-r", r.toFixed(1) + "deg");
        el.style.setProperty("--shy-s", s.toFixed(3));
    };
    const shyClear = (el) => {
        ["--shy-x", "--shy-y", "--shy-r", "--shy-s"].forEach((k) => el.style.removeProperty(k));
        shyActive.delete(el);
    };
    const shyClearAll = () => {
        shyPoked.clear();
        shyTargets.forEach(shyClear);
    };

    /* titik "badan" egg: pusat tombol, kecuali kartu kopi (bintangnya di pojok kanan atas) */
    const shyAnchor = (el, r) => {
        if (el.classList.contains("egg-find-card")) {
            return { x: r.right - (window.innerWidth <= 700 ? 63 : 73), y: r.top + 31 };
        }
        return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    };

    const shyFrame = () => {
        shyRaf = 0;
        if (isOpen || shyPX < -999) return;
        const vh = window.innerHeight;
        shyTargets.forEach((el) => {
            if (shyPoked.has(el)) return;
            const r = el.getBoundingClientRect();
            if (r.bottom < -SHY_RANGE || r.top > vh + SHY_RANGE) {
                if (shyActive.has(el)) shyClear(el);
                return;
            }
            const a = shyAnchor(el, r);
            const dx = a.x - shyPX;
            const dy = a.y - shyPY;
            const d = Math.hypot(dx, dy);
            if (d >= SHY_RANGE) {
                if (shyActive.has(el)) shyClear(el);
                return;
            }
            const k = Math.pow(1 - d / SHY_RANGE, 1.3);
            const ux = dx / Math.max(d, 10);
            const uy = dy / Math.max(d, 10);
            shySet(el, ux * SHY_MAX * k, uy * SHY_MAX * k, ux * 26 * k, 1 - 0.28 * k);
            shyActive.add(el);
        });
    };
    const shyQueue = () => {
        if (!shyRaf) shyRaf = requestAnimationFrame(shyFrame);
    };

    document.addEventListener("pointermove", (event) => {
        if (event.pointerType === "touch" || reduced.matches) return;
        shyPX = event.clientX;
        shyPY = event.clientY;
        shyQueue();
    }, { passive: true });

    window.addEventListener("scroll", () => {
        if (shyPX > -999 && !reduced.matches) shyQueue();
    }, { passive: true });

    document.addEventListener("mouseout", (event) => {
        if (event.relatedTarget) return;
        shyPX = -9999;
        shyPY = -9999;
        shyClearAll();
    });

    /* ditekan / disentuh: egg meringkuk kaget lalu pelan-pelan balik */
    document.addEventListener("pointerdown", (event) => {
        if (isOpen || reduced.matches) return;
        const t = event.target.closest ? event.target.closest("[data-egg-id]") : null;
        if (!t || overlay.contains(t)) return;
        t.style.setProperty("--shy-s", "0.5");
        t.style.setProperty("--shy-r", (Math.random() < 0.5 ? -24 : 24) + "deg");
        shyActive.add(t);
        shyPoked.add(t);
        setTimeout(() => {
            shyPoked.delete(t);
            shyClear(t);
            shyQueue();
        }, POKE_MS);
    }, { passive: true });

    const openEgg = (eggId, trigger) => {
        const d = discoveries[eggId];
        if (!d) return;
        hideTip();
        clearTimeout(openTimer);
        shyClearAll();

        /* Popup ke-11 terkunci sampai 10 easter egg lain ditemukan */
        if (eggId === LAST_ID && foundBeforeLast() < NEED_BEFORE_LAST) {
            if (trigger) {
                trigger.classList.remove("egx-shake");
                void trigger.offsetWidth;
                trigger.classList.add("egx-shake");
                setTimeout(() => trigger.classList.remove("egx-shake"), 520);
            }
            showToast("Sabar, pintu terakhir memang pelit. Baru " + foundBeforeLast() + " dari " + NEED_BEFORE_LAST + " jeda kecil yang kamu temukan.");
            return;
        }

        found.add(eggId);
        saveFound();
        if (trigger) trigger.classList.add("is-found");
        lastTrigger = trigger;

        card.classList.toggle("is-final", eggId === LAST_ID);
        setContent(d);
        resetReveal();
        buildSky();

        isOpen = true;
        overlay.setAttribute("aria-hidden", "false");
        overlay.classList.add("is-open");
        lockScroll();
        if (trigger) trigger.setAttribute("aria-expanded", "true");

        /* sinyal ke js/audio.js: lagu utama diganti lagu egg ini */
        currentEggId = eggId;
        document.dispatchEvent(new CustomEvent("alp:egg-open", { detail: { id: eggId } }));

        setTimeout(() => closeButton.focus({ preventScroll: true }), 60);
        if (eggId === LAST_ID) setTimeout(() => burst(60), 500);
    };

    function closeEgg() {
        if (!isOpen) return;
        isOpen = false;
        overlay.classList.remove("is-open");
        overlay.setAttribute("aria-hidden", "true");
        unlockScroll();

        /* sinyal ke js/audio.js: lagu egg berhenti, lagu utama kembali */
        const closedId = currentEggId;
        currentEggId = null;
        document.dispatchEvent(new CustomEvent("alp:egg-close", { detail: { id: closedId } }));

        const back = lastTrigger;
        lastTrigger = null;
        if (back) {
            back.setAttribute("aria-expanded", "false");
            setTimeout(() => back.focus({ preventScroll: true }), 40);
        }
    }

    document.querySelectorAll("[data-egg-id]").forEach((el) => {
        el.setAttribute("aria-expanded", "false");
    });

    document.addEventListener("click", (event) => {
        const t = event.target.closest("[data-egg-id]");
        if (!t || overlay.contains(t)) return;
        if (!discoveries[t.dataset.eggId]) return;
        event.preventDefault();
        if (reduced.matches) { openEgg(t.dataset.eggId, t); return; }
        /* egg kaget dulu sebentar, baru popup terbuka */
        clearTimeout(openTimer);
        openTimer = setTimeout(() => { if (!isOpen) openEgg(t.dataset.eggId, t); }, OPEN_DELAY);
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && isOpen) {
            event.preventDefault();
            closeEgg();
            return;
        }
        if ((event.key === "Enter" || event.key === " ") && !isOpen) {
            const t = event.target;
            if (t && t.matches && t.matches("[data-egg-id][role='button']")) {
                event.preventDefault();
                openEgg(t.dataset.eggId, t);
            }
        }
    });

    nextButton.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        revealMessage();
    });

    closeButton.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        closeEgg();
    });

    backdrop.addEventListener("click", closeEgg);

    /* Focus trap */
    document.addEventListener("keydown", (event) => {
        if (event.key !== "Tab" || !isOpen) return;
        const focusable = card.querySelectorAll(
            "button, [href], input, textarea, select, [tabindex]:not([tabindex='-1'])"
        );
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
        }
    });

    /* Template lama tetap nonaktif */
    const legacy = $("hiddenMessage");
    if (legacy) legacy.setAttribute("aria-hidden", "true");

    const applyReduced = () => {
        if (!reduced.matches) return;
        [overlay, card, poemText, finalText].forEach((el) => { el.style.transition = "none"; });
    };
    applyReduced();
    if (typeof reduced.addEventListener === "function") {
        reduced.addEventListener("change", applyReduced);
    }

    window.addEventListener("pagehide", () => { if (isOpen) unlockScroll(); });
});