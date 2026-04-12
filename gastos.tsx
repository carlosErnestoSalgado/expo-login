    {/* </Card>

      {/*/* ── Gastos por categoría ─────────────────────────────────────────── /}
      <SectionTitle text="Gastos por categoría" />
      <Card>
        {topCategorias.length === 0 ? (
          <Text style={styles.emptyText} lightColor="#AAA" darkColor="#666">
            Sin gastos registrados este mes.
          </Text>
        ) : (
          topCategorias.map(([cat, monto]) => (
            <RNView key={cat}>
              <RNView style={styles.catRow}>
                <Text style={styles.catLabel} lightColor="#333" darkColor="#DDD">
                  {cat}
                </Text>
                <Text style={styles.catValue} lightColor="#1A1A1A" darkColor="#FFF">
                  {fmt(monto)}
                </Text>
              </RNView>
              {/* Mini barra proporcional al mayor gasto */}
              <RNView style={styles.catTrack}>
                <RNView
                  style={[
                    styles.catFill,
                    {
                      width: `${pct(monto, topCategorias[0][1])}%`,
                      backgroundColor: isDark ? '#3A3A3C' : '#E8F0FE',
                    },
                  ]}
                />
              </RNView>
            </RNView>
          ))
        )}

        {/* Ver todos los gastos → pantalla de gastos */}
        <Pressable
          style={({ pressed }) => [styles.linkBtn, pressed && { opacity: 0.5 }]}
          onPress={() => navigation.navigate('Gastos')}
        >
          <Text style={styles.linkBtnText}>Ver detalle completo →</Text>
        </Pressable>
      </Card> */}

      {/* ── Meta de ahorro ───────────────────────────────────────────────── */}
      <SectionTitle text="Meta de ahorro individual" />
      <Card>
        <RNView style={styles.metaHeader}>
          <Text style={styles.metaPct} lightColor="#1A1A1A" darkColor="#FFF">
            {progreso}%
          </Text>
          <Text style={styles.metaValues} lightColor="#888" darkColor="#666">
            {fmt(saldo)} / {fmt(meta)}
          </Text>
        </RNView>
        <ProgressBar percent={progreso} />
        <Text style={styles.metaHint} lightColor="#AAA" darkColor="#555">
          {progreso >= 100
            ? '🎉 ¡Meta alcanzada este mes!'
            : `Te faltan ${fmt(meta - saldo)} para cumplir tu meta.`}
        </Text>
      </Card>



const handleLogin = async () => {
    const result = await authService.login(email, password);

    if (!email.trim() || !password.trim()) {
    showMessage({
      message: "Campos vacíos",
      description: "Por favor, ingresa tus credenciales",
      type: "warning",
    });
    return; // <--- DETIENE LA EJECUCIÓN
  }
    if (result.success) {
      setUser(result.user || null);

      setIsLogged(true);
    } else {
      showMessage({
      message: "Error de acceso",
      description: result.message,
      type: "danger", // 'success', 'info', 'warning', 'danger'
      backgroundColor: "#ff4444", // Tu color personalizado
      color: "#fff", // Color del texto
    });
    }
  };