package pl.nbp.copilot.image;

import net.coobird.thumbnailator.Thumbnails;
import org.springframework.stereotype.Component;
import pl.nbp.copilot.config.ImageProperties;

import javax.imageio.ImageIO;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;

@Component
public class ImageCompressor {

    private final ImageProperties props;

    public ImageCompressor(ImageProperties props) {
        this.props = props;
    }

    public byte[] compress(byte[] inputBytes, String contentType) throws IOException {
        // Read dimensions to decide whether downscaling is needed
        var original = ImageIO.read(new ByteArrayInputStream(inputBytes));
        int longEdge = Math.max(original.getWidth(), original.getHeight());

        var baos = new ByteArrayOutputStream();
        var builder = Thumbnails.of(new ByteArrayInputStream(inputBytes))
            .outputQuality(props.jpegQuality())
            .outputFormat("jpeg");

        if (longEdge > props.maxLongEdge()) {
            builder.size(props.maxLongEdge(), props.maxLongEdge())
                   .keepAspectRatio(true);
        } else {
            // Keep original dimensions — just re-encode
            builder.scale(1.0);
        }

        builder.toOutputStream(baos);
        return baos.toByteArray();
    }
}
