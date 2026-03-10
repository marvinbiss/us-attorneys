<?php
/**
 * Plugin Name: ServicesArtisans — Badge Artisan Verifie
 * Plugin URI: https://servicesartisans.fr/badge-artisan
 * Description: Affichez votre badge "Artisan Verifie" ServicesArtisans sur votre site WordPress. Note, avis et statut en temps reel. Gratuit et sans engagement.
 * Version: 1.0.0
 * Author: ServicesArtisans.fr
 * Author URI: https://servicesartisans.fr
 * License: GPL v2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: servicesartisans
 * Requires at least: 5.0
 * Tested up to: 6.7
 * Requires PHP: 7.4
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

define( 'SA_PLUGIN_VERSION', '1.0.0' );
define( 'SA_PLUGIN_URL', plugin_dir_url( __FILE__ ) );
define( 'SA_API_BASE', 'https://servicesartisans.fr' );

// ─── Admin Settings ───────────────────────────────────────────

add_action( 'admin_menu', 'sa_add_settings_page' );
add_action( 'admin_init', 'sa_register_settings' );

function sa_add_settings_page() {
    add_options_page(
        'ServicesArtisans',
        'ServicesArtisans',
        'manage_options',
        'servicesartisans',
        'sa_render_settings_page'
    );
}

function sa_register_settings() {
    register_setting( 'sa_settings_group', 'sa_provider_slug', array(
        'type'              => 'string',
        'sanitize_callback' => 'sanitize_text_field',
        'default'           => '',
    ) );
    register_setting( 'sa_settings_group', 'sa_provider_name', array(
        'type'              => 'string',
        'sanitize_callback' => 'sanitize_text_field',
        'default'           => '',
    ) );
    register_setting( 'sa_settings_group', 'sa_badge_style', array(
        'type'              => 'string',
        'sanitize_callback' => 'sanitize_text_field',
        'default'           => 'light',
    ) );
    register_setting( 'sa_settings_group', 'sa_show_devis_button', array(
        'type'              => 'boolean',
        'sanitize_callback' => 'rest_sanitize_boolean',
        'default'           => true,
    ) );
}

function sa_render_settings_page() {
    $slug  = get_option( 'sa_provider_slug', '' );
    $name  = get_option( 'sa_provider_name', '' );
    $style = get_option( 'sa_badge_style', 'light' );
    $devis = get_option( 'sa_show_devis_button', true );
    ?>
    <div class="wrap">
        <h1>ServicesArtisans — Badge Artisan</h1>
        <p>Configurez votre badge pour l'afficher sur votre site.</p>

        <form method="post" action="options.php">
            <?php settings_fields( 'sa_settings_group' ); ?>
            <table class="form-table">
                <tr>
                    <th scope="row"><label for="sa_provider_slug">Identifiant artisan</label></th>
                    <td>
                        <input type="text" id="sa_provider_slug" name="sa_provider_slug" value="<?php echo esc_attr( $slug ); ?>" class="regular-text" placeholder="ex: dupont-plomberie-paris" />
                        <p class="description">
                            Votre slug ou identifiant sur ServicesArtisans.fr.<br>
                            Vous le trouverez dans l'URL de votre fiche : servicesartisans.fr/services/.../<strong>votre-slug</strong>
                        </p>
                    </td>
                </tr>
                <tr>
                    <th scope="row"><label for="sa_provider_name">Nom de l'entreprise</label></th>
                    <td>
                        <input type="text" id="sa_provider_name" name="sa_provider_name" value="<?php echo esc_attr( $name ); ?>" class="regular-text" placeholder="ex: Dupont Plomberie" />
                        <p class="description">Utilise uniquement si votre fiche n'est pas encore referencee.</p>
                    </td>
                </tr>
                <tr>
                    <th scope="row"><label for="sa_badge_style">Style du badge</label></th>
                    <td>
                        <select id="sa_badge_style" name="sa_badge_style">
                            <option value="light" <?php selected( $style, 'light' ); ?>>Clair</option>
                            <option value="dark" <?php selected( $style, 'dark' ); ?>>Sombre</option>
                            <option value="minimal" <?php selected( $style, 'minimal' ); ?>>Minimal</option>
                        </select>
                    </td>
                </tr>
                <tr>
                    <th scope="row">Bouton devis</th>
                    <td>
                        <label>
                            <input type="checkbox" name="sa_show_devis_button" value="1" <?php checked( $devis ); ?> />
                            Afficher un bouton "Demander un devis" sous le badge
                        </label>
                    </td>
                </tr>
            </table>

            <?php submit_button( 'Enregistrer' ); ?>
        </form>

        <!-- Preview -->
        <h2>Apercu</h2>
        <div style="background:#f0f0f1;padding:24px;border-radius:8px;max-width:360px">
            <?php echo sa_render_badge_html(); ?>
        </div>

        <h2>Utilisation</h2>
        <table class="form-table">
            <tr>
                <th>Widget</th>
                <td><code>Apparence &gt; Widgets &gt; ServicesArtisans Badge</code></td>
            </tr>
            <tr>
                <th>Shortcode badge</th>
                <td><code>[servicesartisans_badge]</code></td>
            </tr>
            <tr>
                <th>Shortcode devis</th>
                <td><code>[servicesartisans_devis]</code></td>
            </tr>
            <tr>
                <th>Shortcode complet</th>
                <td><code>[servicesartisans_badge style="dark" devis="oui"]</code></td>
            </tr>
        </table>
    </div>
    <?php
}

// ─── Badge Rendering ──────────────────────────────────────────

function sa_get_badge_url( $style = null ) {
    $slug = get_option( 'sa_provider_slug', '' );
    $style = $style ?: get_option( 'sa_badge_style', 'light' );

    if ( $slug ) {
        return SA_API_BASE . '/api/badge/verified?slug=' . urlencode( $slug ) . '&style=' . urlencode( $style );
    }

    // Fallback: static badge with name
    $name = get_option( 'sa_provider_name', get_bloginfo( 'name' ) );
    $params = http_build_query( array(
        'name'    => $name,
        'service' => 'Artisan',
        'rating'  => '4.5',
        'reviews' => '0',
        'style'   => $style,
    ) );
    return SA_API_BASE . '/api/badge?' . $params;
}

function sa_get_profile_url() {
    $slug = get_option( 'sa_provider_slug', '' );
    if ( $slug ) {
        return SA_API_BASE . '/services/artisan/france/' . urlencode( $slug );
    }
    return SA_API_BASE;
}

function sa_render_badge_html( $atts = array() ) {
    $style      = isset( $atts['style'] ) ? sanitize_text_field( $atts['style'] ) : null;
    $show_devis = isset( $atts['devis'] ) ? ( $atts['devis'] === 'oui' || $atts['devis'] === '1' ) : get_option( 'sa_show_devis_button', true );

    $badge_url   = sa_get_badge_url( $style );
    $profile_url = sa_get_profile_url();
    $name        = get_option( 'sa_provider_name', get_bloginfo( 'name' ) );
    $is_minimal  = ( $style ?: get_option( 'sa_badge_style', 'light' ) ) === 'minimal';

    $width  = $is_minimal ? 220 : 320;
    $height = $is_minimal ? 54 : 110;

    $html = '<div class="sa-badge-container">';
    $html .= '<a href="' . esc_url( $profile_url ) . '" target="_blank" rel="noopener" title="' . esc_attr( $name ) . ' sur ServicesArtisans.fr">';
    $html .= '<img src="' . esc_url( $badge_url ) . '" alt="' . esc_attr( $name ) . ' — Artisan sur ServicesArtisans" width="' . $width . '" height="' . $height . '" loading="lazy" style="max-width:100%;height:auto" />';
    $html .= '</a>';

    if ( $show_devis ) {
        $html .= '<a href="' . esc_url( $profile_url ) . '" target="_blank" rel="noopener" class="sa-devis-button">Demander un devis gratuit</a>';
    }

    $html .= '<a href="' . esc_url( SA_API_BASE ) . '" target="_blank" rel="noopener" class="sa-powered-by">Propulse par ServicesArtisans.fr</a>';
    $html .= '</div>';

    return $html;
}

// ─── Shortcodes ───────────────────────────────────────────────

add_shortcode( 'servicesartisans_badge', 'sa_shortcode_badge' );
add_shortcode( 'servicesartisans_devis', 'sa_shortcode_devis' );

function sa_shortcode_badge( $atts ) {
    $atts = shortcode_atts( array(
        'style' => null,
        'devis' => null,
    ), $atts, 'servicesartisans_badge' );

    sa_enqueue_styles();
    return sa_render_badge_html( $atts );
}

function sa_shortcode_devis( $atts ) {
    $atts = shortcode_atts( array(
        'texte' => 'Demander un devis gratuit',
        'style' => 'primary',
    ), $atts, 'servicesartisans_devis' );

    sa_enqueue_styles();
    $profile_url = sa_get_profile_url();

    $class = $atts['style'] === 'outline' ? 'sa-devis-button sa-devis-outline' : 'sa-devis-button';

    $html = '<div class="sa-devis-container">';
    $html .= '<a href="' . esc_url( $profile_url ) . '" target="_blank" rel="noopener" class="' . esc_attr( $class ) . '">' . esc_html( $atts['texte'] ) . '</a>';
    $html .= '<span class="sa-powered-by-inline">via <a href="' . esc_url( SA_API_BASE ) . '" target="_blank" rel="noopener">ServicesArtisans.fr</a></span>';
    $html .= '</div>';

    return $html;
}

// ─── Widget ───────────────────────────────────────────────────

class SA_Badge_Widget extends WP_Widget {

    public function __construct() {
        parent::__construct(
            'sa_badge_widget',
            'ServicesArtisans Badge',
            array(
                'description'           => 'Affichez votre badge Artisan Verifie ServicesArtisans.',
                'customize_selective_refresh' => true,
            )
        );
    }

    public function widget( $args, $instance ) {
        sa_enqueue_styles();
        $title = ! empty( $instance['title'] ) ? apply_filters( 'widget_title', $instance['title'] ) : '';
        $style = ! empty( $instance['style'] ) ? $instance['style'] : null;
        $devis = isset( $instance['show_devis'] ) ? $instance['show_devis'] : true;

        echo $args['before_widget'];
        if ( $title ) {
            echo $args['before_title'] . esc_html( $title ) . $args['after_title'];
        }
        echo sa_render_badge_html( array(
            'style' => $style,
            'devis' => $devis ? 'oui' : 'non',
        ) );
        echo $args['after_widget'];
    }

    public function form( $instance ) {
        $title      = ! empty( $instance['title'] ) ? $instance['title'] : '';
        $style      = ! empty( $instance['style'] ) ? $instance['style'] : 'light';
        $show_devis = isset( $instance['show_devis'] ) ? (bool) $instance['show_devis'] : true;
        ?>
        <p>
            <label for="<?php echo esc_attr( $this->get_field_id( 'title' ) ); ?>">Titre :</label>
            <input class="widefat" id="<?php echo esc_attr( $this->get_field_id( 'title' ) ); ?>" name="<?php echo esc_attr( $this->get_field_name( 'title' ) ); ?>" type="text" value="<?php echo esc_attr( $title ); ?>" placeholder="Artisan Verifie" />
        </p>
        <p>
            <label for="<?php echo esc_attr( $this->get_field_id( 'style' ) ); ?>">Style :</label>
            <select class="widefat" id="<?php echo esc_attr( $this->get_field_id( 'style' ) ); ?>" name="<?php echo esc_attr( $this->get_field_name( 'style' ) ); ?>">
                <option value="light" <?php selected( $style, 'light' ); ?>>Clair</option>
                <option value="dark" <?php selected( $style, 'dark' ); ?>>Sombre</option>
                <option value="minimal" <?php selected( $style, 'minimal' ); ?>>Minimal</option>
            </select>
        </p>
        <p>
            <input type="checkbox" id="<?php echo esc_attr( $this->get_field_id( 'show_devis' ) ); ?>" name="<?php echo esc_attr( $this->get_field_name( 'show_devis' ) ); ?>" value="1" <?php checked( $show_devis ); ?> />
            <label for="<?php echo esc_attr( $this->get_field_id( 'show_devis' ) ); ?>">Afficher bouton devis</label>
        </p>
        <p class="description">
            Configurez votre identifiant dans <a href="<?php echo admin_url( 'options-general.php?page=servicesartisans' ); ?>">Reglages &gt; ServicesArtisans</a>.
        </p>
        <?php
    }

    public function update( $new_instance, $old_instance ) {
        $instance = array();
        $instance['title']      = sanitize_text_field( $new_instance['title'] ?? '' );
        $instance['style']      = sanitize_text_field( $new_instance['style'] ?? 'light' );
        $instance['show_devis'] = ! empty( $new_instance['show_devis'] );
        return $instance;
    }
}

add_action( 'widgets_init', function () {
    register_widget( 'SA_Badge_Widget' );
} );

// ─── Styles ───────────────────────────────────────────────────

function sa_enqueue_styles() {
    if ( wp_style_is( 'servicesartisans', 'enqueued' ) ) {
        return;
    }
    wp_register_style( 'servicesartisans', false, array(), SA_PLUGIN_VERSION );
    wp_enqueue_style( 'servicesartisans' );
    wp_add_inline_style( 'servicesartisans', sa_get_inline_css() );
}

function sa_get_inline_css() {
    return '
.sa-badge-container {
    text-align: center;
    max-width: 340px;
    margin: 0 auto;
}
.sa-badge-container a img {
    display: inline-block;
    border: none;
    box-shadow: none;
}
.sa-devis-button {
    display: block;
    margin: 10px auto 0;
    padding: 10px 20px;
    background: #3464f4;
    color: #fff !important;
    text-decoration: none !important;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 600;
    text-align: center;
    max-width: 280px;
    transition: background 0.2s;
    line-height: 1.4;
}
.sa-devis-button:hover {
    background: #1d4fd7;
    color: #fff !important;
}
.sa-devis-outline {
    background: transparent;
    color: #3464f4 !important;
    border: 2px solid #3464f4;
}
.sa-devis-outline:hover {
    background: #3464f4;
    color: #fff !important;
}
.sa-powered-by {
    display: block;
    margin-top: 8px;
    font-size: 11px;
    color: #94a3b8 !important;
    text-decoration: none !important;
    text-align: center;
}
.sa-powered-by:hover {
    color: #3464f4 !important;
}
.sa-devis-container {
    text-align: center;
    max-width: 340px;
    margin: 0 auto;
}
.sa-powered-by-inline {
    display: block;
    margin-top: 6px;
    font-size: 11px;
    color: #94a3b8;
}
.sa-powered-by-inline a {
    color: #94a3b8 !important;
    text-decoration: none !important;
}
.sa-powered-by-inline a:hover {
    color: #3464f4 !important;
}';
}

// ─── Plugin Links ─────────────────────────────────────────────

add_filter( 'plugin_action_links_' . plugin_basename( __FILE__ ), 'sa_plugin_action_links' );

function sa_plugin_action_links( $links ) {
    $settings_link = '<a href="' . admin_url( 'options-general.php?page=servicesartisans' ) . '">Reglages</a>';
    array_unshift( $links, $settings_link );
    return $links;
}

// ─── Activation ───────────────────────────────────────────────

register_activation_hook( __FILE__, 'sa_activate' );

function sa_activate() {
    add_option( 'sa_provider_slug', '' );
    add_option( 'sa_provider_name', '' );
    add_option( 'sa_badge_style', 'light' );
    add_option( 'sa_show_devis_button', true );
}

register_deactivation_hook( __FILE__, 'sa_deactivate' );

function sa_deactivate() {
    // On ne supprime PAS les options pour garder la config si reinstalle
}
